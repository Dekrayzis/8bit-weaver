const IMAGE_STYLE_PROMPTS: Record<string, string> = {
  'pixel-art': 'retro 8-bit pixel art style, vibrant colors, game scene, top-down RPG perspective, crisp pixels, no text or UI elements',
  'painterly': 'painterly fantasy illustration, rich colors, atmospheric lighting, detailed environment, storybook quality, no text',
  'cartoon': 'cartoon adventure game style, bold outlines, bright colors, whimsical, point-and-click adventure aesthetic, no text',
  'realistic': 'photorealistic environment, cinematic lighting, detailed textures, atmospheric, fantasy setting, no text or UI'
};

export interface ImageGenerationProgress {
  current: number;
  total: number;
  currentRoomName: string;
  status: 'generating' | 'done' | 'error';
  error?: string;
}

export async function generateRoomImage(
  roomName: string,
  roomDescription: string,
  apiKey: string,
  style: string = 'pixel-art',
  model: string = 'dall-e-3'
): Promise<string> {
  const stylePrompt = IMAGE_STYLE_PROMPTS[style] || IMAGE_STYLE_PROMPTS['pixel-art'];
  
  const prompt = `Scene: "${roomName}" — ${roomDescription}. Style: ${stylePrompt}. The image should evoke a sense of adventure and mystery.`;

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned from API');

  return `data:image/png;base64,${b64}`;
}

export async function generateAllRoomImages(
  rooms: Record<string, { name: string; description: string; imageUrl?: string }>,
  apiKey: string,
  style: string,
  model: string,
  onProgress: (progress: ImageGenerationProgress) => void,
  skipExisting: boolean = true
): Promise<Record<string, string>> {
  const roomEntries = Object.entries(rooms);
  const toGenerate = skipExisting 
    ? roomEntries.filter(([, r]) => !r.imageUrl)
    : roomEntries;
  
  const total = toGenerate.length;
  const results: Record<string, string> = {};

  for (let i = 0; i < toGenerate.length; i++) {
    const [id, room] = toGenerate[i];
    
    onProgress({
      current: i + 1,
      total,
      currentRoomName: room.name,
      status: 'generating'
    });

    try {
      const imageUrl = await generateRoomImage(room.name, room.description, apiKey, style, model);
      results[id] = imageUrl;

      // Small delay to avoid rate limiting
      if (i < toGenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      onProgress({
        current: i + 1,
        total,
        currentRoomName: room.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      throw err;
    }
  }

  onProgress({ current: total, total, currentRoomName: '', status: 'done' });
  return results;
}
