import { NextRequest, NextResponse } from 'next/server';

// POST /api/analyze-photo - Analyze a pet image using AI VLM
// Requires z-ai-web-dev-sdk which only works in the z.ai environment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Missing required field: image (base64 encoded)' },
        { status: 400 }
      );
    }

    // Dynamically import ZAI — it only works inside the z.ai environment
    let ZAI: any;
    try {
      ZAI = (await import('z-ai-web-dev-sdk')).default;
    } catch {
      return NextResponse.json(
        {
          error: 'AI analysis is only available when deployed on the z.ai platform. In local/Vercel environments, please fill in the pet details manually.',
          code: 'ZAI_NOT_AVAILABLE',
        },
        { status: 503 }
      );
    }

    let zai: any;
    try {
      zai = await ZAI.create();
    } catch {
      return NextResponse.json(
        {
          error: 'AI service not configured. Photo analysis requires the z.ai environment. Please fill in the pet details manually.',
          code: 'ZAI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Build image data URL for the VLM
    const imageUrl = image.startsWith('data:')
      ? image
      : `data:image/jpeg;base64,${image}`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'system',
          content:
            'You are a pet identification expert. Analyze pet images and return structured data about the animal. Respond ONLY with valid JSON, no markdown, no code blocks.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this pet image and return a JSON object with these fields exactly: species (must be "dog", "cat", or "other"), breed (best guess of the breed), colors (array of 1-3 color names in Spanish), uniqueMarks (any distinctive features in Spanish). Example: {"species":"dog","breed":"Golden Retriever","colors":["Dorado","Blanco"],"uniqueMarks":"Collar rojo, mancha blanca en el pecho"}. Respond with ONLY valid JSON.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const messageContent = response.choices[0]?.message?.content;

    if (!messageContent) {
      return NextResponse.json(
        { error: 'AI analysis returned no content' },
        { status: 500 }
      );
    }

    // Parse the JSON response from the AI
    // Strip markdown code blocks if present
    const cleanedContent = messageContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(cleanedContent);
    } catch {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'Failed to parse AI response as JSON', raw: messageContent },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      analysis,
    });
  } catch (error: unknown) {
    console.error('Error analyzing photo:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to analyze photo', details: message },
      { status: 500 }
    );
  }
}
