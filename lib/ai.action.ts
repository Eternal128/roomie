import puter from "@heyputer/puter.js";
import { ROOMIE_RENDER_PROMPT } from "./constants";

export interface Generate3DViewParams {
    sourceImage: string;
    customPrompt?: string;
}

export const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generate3DView = async ({ sourceImage, customPrompt }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1] as 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp';

    if (!mimeType || !base64Data) throw new Error('Invalid source image payload');

    const prompt = customPrompt?.trim()
        ? `${ROOMIE_RENDER_PROMPT}

CRITICAL STYLE OVERRIDE — APPLY THIS TO THE ENTIRE RENDER:
${customPrompt.trim()}

Every surface, material, piece of furniture, and lighting choice must visibly reflect the above preferences.`
        : ROOMIE_RENDER_PROMPT;

    // txt2img returns an HTMLImageElement directly — just read .src
    const image = await puter.ai.txt2img(prompt, {
        provider: 'gemini',
        model: 'gemini-2.5-flash-image-preview',
        input_image: base64Data,
        input_image_mime_type: mimeType,
    });

    const renderedImage = image?.src ?? null;

    return { renderedImage, renderedPath: undefined };
};