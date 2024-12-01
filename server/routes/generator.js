import express from 'express'
import * as dotenv from 'dotenv';
import { getRandomMessage, getRandomPrompt } from './index.js';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, FinishReason } from "@google/generative-ai";

dotenv.config(); 
const generatorRouter = express.Router();

const startsys = "<|im_start|>system";
// const startsys = "<start_of_turn>system";

const startresp = "<|im_start|>assistant";
// const startresp = "<start_of_turn>model";

const startuser = "<|im_start|>user";
// const startuser = "<start_of_turn>user";

const ending = "";
// const ending = "<end_of_turn>";

const sdPrompt = `
You are an AI model that is highly skilled at Stable Diffusion 1.5 Prompt Generation. You will generate a creative and detailed image prompt based on a user's request, emulating the distinctive style and structure observed in example prompts. The system will aim for accuracy, detail, and flexibility, ensuring the generated prompts are suitable for use with AI image generator Stable Diffusion 1.5. The prompt should be consist of a short paragraph. Only respond with a single prompt. The created image should no include text.

Follow these steps to create the prompt:

    1. Faithful Style Replication: You will prioritize mirroring the nuanced style of the examples. This includes:
        a. Concise Subject Introduction: Starting with a clear and brief subject or scene description.
        b. Varied Style Keywords: Incorporating a diverse range of keywords related to art style, photography techniques, and desired aesthetics (e.g., "cinematic", "Pixar-style", "photorealistic", "minimalist", "surrealism").
        c. Artistic References: Integrating specific artists, art movements, or pop culture references to guide the AI's stylistic interpretation.
        d. Optional Technical Details: Including optional yet specific details about:
            - Camera and Lens: "Canon EOS R5", "Nikon D850 with a macro lens", "35mm lens at f/8"
            - Film Stock: "Kodak film", "Fujifilm Provia"
            - Post-Processing: "Film grain", "lens aberration", "color negative", "bokeh."
        e. Emphasis Techniques: Utilizing parentheses, brackets, or capitalization to highlight key elements within the prompt.
    2. User-Centric Design:
        a. Clarity and Specificity: The generated prompts should be clear, specific, and easily understood by the AI.
    3. Comprehensive Prompt Structure:
        a. Subject: Clearly define the primary subject(s) of the image.
        b. Action/Pose: Describe actions or poses the subject(s) might be performing.
        c. Environment/Background: Establish the scene's setting, including background elements.
        d. Style/Art Medium: Specify the desired artistic style or medium (photography, illustration, painting, pixel art, etc.).
        e. Lighting: Detail the lighting conditions (soft light, dramatic light, natural light, studio lighting, etc.).
        f. Color Palette: Suggest a specific color palette or individual colors.
        g. Composition: Indicate the preferred composition (close-up, wide-angle, symmetrical, minimalist, etc.).
        h. Details/Texture: Include descriptions of textures, patterns, and specific features.
        i. Mood/Atmosphere: Optionally evoke a mood or atmosphere to guide the AI's interpretation (melancholic, mysterious, serene, etc.)

    Please follow these Prompt Examples:

    Return only the prompt. Avoid returning descriptive information.
`
const temp = 0.7
const topP = 0.9
const topK = 40
const max_tokens = 150

const llmData = {
    "prompt": sdPrompt,
    "max_context_length": 4096,
    "max_length": max_tokens,
    "rep_pen": 1.1,
    "rep_pen_range": 320,
    "rep_pen_slope": 0.7,
    "temperature": temp,
    "tfs": 1,
    "top_a": 0,
    "top_k": topK,
    "top_p": topP,
    "typical": 1,
    "stop_sequence": ["### Instruction:","### End Response","### Response:","[Description ends here]","[END]", "###","[]","[EOF]"],
    "bypass_eos": false
}

async function getMessage(imageType, seed, override, llm = "local", adMode) {
    let userPrompt = ""            
    let messageResponse = { message: override.toUpperCase(), "includesBadWord": false }
    let msg = messageResponse
    if(override === "") {
        const apiType = imageType === "meme" ? "meme" : "message";
        msg = await getRandomMessage(apiType, seed)
    } else {
        const mParts = msg.message.split("|")
        msg = { "title": mParts[0], "outputString": mParts[1], includesBadWord: false }
    }
    // console.log(msg)

    const extra = adMode ? `,${process.env.LLM_PROMPT_ADDITION} ,` : ""
    if(llm === "local") {
        if(imageType === "meme") {
            let memeMsg = msg.outputString !== "" ? `${msg.title} ${msg.outputString}` : msg.title
            userPrompt = `${startsys}\n${sdPrompt}\n${startuser}\nCreate a prompt for the meme phrase${extra} '${memeMsg}'\n${ending}${startresp}\n`
        } else {
            userPrompt = `${startsys}\n${sdPrompt}\n${startuser}\nCreate a prompt for the an image based on the phrase${extra} '${msg.title}' heavily affected by the phrase '${msg.outputString}'\n${ending}${startresp}\n`
        }
    } else {
        if(imageType === "meme") {
            let memeMsg = msg.outputString !== "" ? `${msg.title} ${msg.outputString}` : msg.title
            userPrompt = `${sdPrompt}\nCreate a prompt for the meme phrase${extra} '${memeMsg}'`
        } else {
            userPrompt = `${sdPrompt}\nCreate a prompt for the an image based on the phrase${extra} '${msg.title}' heavily affected by the phrase '${msg.outputString}'`
        }
        userPrompt = userPrompt + " Do not use square brackets or curly brackets. Try not to use a surreal description."
    }

    return {title: msg.title, message: msg.outputString, userPrompt, includesBadWord: msg.includesBadWord}
}

async function buildPrompt(userPrompt, seed, generatorType = "flux", llm = "local") {
    llmData["seed"] = seed
    if(generatorType === "sd15" || generatorType === "comfy") {
        userPrompt = userPrompt.replace("Prompt Examples:",`Prompt Examples (short, brief phrases separated by commas):
            - skinny male fantasy scientist, long dark hair, 1920s, elegant, highly detailed, intricate, smooth, sharp focus, artstation, digital paining, concept art, art by donato giancola, greg rutkowski, artgerm, cedric peyravernay
            - vibrant tapestry of humanity, a group portrait, diverse faces, (varied ages), warm smiles, laughter lines, curious eyes, sunlight dappling through leaves, vibrant clothing, textures of silk and cotton, hands intertwined, a sense of connection, unity, and shared joy, intricate details, photorealistic, golden hour light
            - portrait of a mech warrior, female, fantasy, circuitry, explosion, dramatic, intricate, elegant, highly detailed, digital painting, artstation, concept art, smooth, sharp focus, illustration, by piotr rusnarczyk
            - a complex ancient alchemists interior, 4k, stone table, giant athanor, alembic, beakers full of liquid, knobs, glass orbs, candle lighting, octane render, natural color scheme, architectural photography, f 32, still from movie by david lynch`)
    } else if(generatorType === "flux") {
        userPrompt = userPrompt.replace("Prompt Examples:",`Prompt Examples:
            - A woman with soft, tousled hair reclines in a plush velvet armchair in a cozy hotel room, her face relaxed and serene, looking into the camera with a flirty smirk. She wears worn unbuttoned jeans and an oversized sweater. A guitar leans against the chair, and a cup of steaming tea sits on the side table. The room is bathed in a soft, warm glow from a candle, casting gentle shadows and creating a romantic, intimate atmosphere. The lighting is soft and diffused, with a warm, golden hue, enhancing the cozy, nostalgic feel. The background elements are gently out of focus, adding to the serene, dreamy quality. The scene is framed with a slight film grain, giving it a timeless, cinematic look inspired by the visual style of director Wes Anderson.
            - In an ancient enchanted forest with hazy sky and mountainous terrain, a centered subject stands on a balcony railing, eye-level shot with clear perspective. The figure, with fair skin and flowing dark hair, wears an ethereal, flowing gown. A gentle, serene expression on their face as they gaze into the distance. The background features lush, verdant foliage with a triadic Earth Tone palette. Backlighting adds depth, casting a soft, warm glow around the figure. The scene is painted in an impressionistic style with a blue palette, reminiscent of John Singer Sargent's work. Cinematic and sensual, the lighting setup includes a warm, golden backlight and soft, diffused sidelights, creating a natural point rose hue. Film grain and subtle color grading enhance the mystical atmosphere.
            - In a hazy, mountainous realm under a twilight sky, an ancient, enchanted forest stretches endlessly. A balcony railing frames the centered subject, with a straight, eye-level shot offering a clear perspective. Triadic and earth-tone colors blend harmoniously, enhanced by a blue palette and backlighting that adds depth. The scene, painted in an impressionistic style reminiscent of John Singer Sargent, is both cinematic and sensual, with a natural point of rose. CGI art by Tove Jansson captures the magic and mystery of this otherworldly place.
            `)
        userPrompt = userPrompt.replace("Stable Diffusion 1.5", "Flux")
        // llmData["max_length"] = 150
    }
    llmData["prompt"] = userPrompt

    let finalPrompt = ""
    let titleOverride = ""
    let msgOverride = ""
    if(titleOverride !== "") {
        finalPrompt = `${titleOverride}|${msgOverride}`
    } else {
        if(llm === "local") {
            const llmImagePrompt = await fetch(process.env.LOCAL_LLM_API, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(llmData)
            });
            const data1 = await llmImagePrompt.json();
        
            finalPrompt = data1["results"][0]["text"]
        } else if (llm === "gemini") {
            const safetySettings = [
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
            ];
            
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    candidateCount: 1,
                    maxOutputTokens: max_tokens,
                    temperature: temp,
                    topP: topP,
                    topK: topK
                    },
                safetySettings: safetySettings
            });

            const geminiResult = await model.generateContent(
                llmData["prompt"],
            );                
            
            const candidate = geminiResult.response.candidates[0]
            if(candidate.finishReason !== FinishReason.STOP && candidate.finishReason !== FinishReason.MAX_TOKENS) {
                console.log("Failed Gemini: " + candidate.finishReason)
                return ""
            }

            const responseText = geminiResult.response.text().replace("\n<|im_end|>","").replace(",  ", ", ").trim()
            console.log(responseText);
            finalPrompt = responseText
        }
    }

    return finalPrompt
}

generatorRouter.get('/', function(req, res, next) {
    res.send({ title: 'Generator' });
});

generatorRouter.post('/getPrompt/:llm/:generator/:type/:seed', async (req, res, next) => {
    const imageType = req.params.type;  
    const llm = req.params.llm;  
    const generator = req.params.generator;  
    const seed = req.params.seed;
    const override = req.body.override ?? ""
    const adMode = req.body.adMode && req.body.adMode !== 0
    try {
        const messageData = await getMessage(imageType, seed, override, llm, adMode)
        let finalPrompt = "Error"
        if(!messageData.includesBadWord) {
            finalPrompt = await buildPrompt(messageData.userPrompt, seed, generator, llm)
        } else {
            finalPrompt = await getRandomPrompt("sd15", seed)
        }
        finalPrompt = adMode ? `${process.env.SD_PROMPT_ADDITION}, ${finalPrompt}` : finalPrompt
        const prompt = {prompt: finalPrompt, includesBadWord: messageData.includesBadWord, title: messageData.title, message: messageData.message}

        if (!res.headersSent) {
            res.json(prompt);
        } else {
            console.warn('Headers already sent in /getPrompt. Skipping response.');
        }
    } catch (error) {
        console.error("Error getting prompt:", error);
        res.status(500).json({ error: 'Error generating prompt' });
        //next(error);
    }
})

generatorRouter.post('/getImage/:generator/:seed', async (req, res, next) => {
    const generator = req.params.generator;  
    // const generator = "sd15"
    const seed = req.params.seed;
    const checkpoint = req.body.checkpoint ?? ""
    const finalPrompt = req.body.prompt ?? ""
    const port = req.body.port ?? 8188
    try {
        // console.log(finalPrompt);
        const imageData = await generateImage(finalPrompt, seed, generator, checkpoint, port)

        if (!res.headersSent) {
            res.json(imageData);
        } else {
            console.warn('Headers already sent in /getImage. Skipping response.');
        }
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: 'Error generating image' });
        // next(error);
    }
})

async function generateImage(finalPrompt, seed, generatorType = "flux", checkpoint, port) {
    let image = ""
    if(generatorType === "flux" || generatorType === "comfy") {
        try {
            if(generatorType === "flux") {
                finalPrompt = finalPrompt.replace("__recv/celeb/main-fav__", "")
            }
            let generatorData = {
                "imageGenerator": generatorType,
                "port": port,
                "seed": seed,
                "prompt": finalPrompt,
                "checkpoint": checkpoint
            }
            const imageCreation = await fetch(process.env.COMFY_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(generatorData).toString()
            });
            let imageData = await imageCreation.json();

            return imageData
        } catch (error) {
            console.error('Error calling Flux:', error);
        }
    } else if(generatorType === "sd15") {
        try {
            let checkpointChange = {
                "sd_model_checkpoint": checkpoint
            }
            await fetch(`${process.env.LOCAL_SD_API}/options`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkpointChange)
            });

            let sdData = {
                "prompt": finalPrompt,
                "negative_prompt": "nsfw",
                "seed": seed,
                "sampler_name": "Euler a",
                "batch_size": 1,
                "steps": 25,
                "cfg_scale": 3.5,
                "clip_skip": 1,
                "width": "768",
                "height": "512",
                "detailer": true,
                "save_images_before_detailer": false,
                "detailer_model": "Detailer",
                "detailer_classes": "",
                "detailer_conf": 0.5,
                "detailer_max": 4,
                "detailer_iou": 0.5,
                "detailer_min_size": 0.1,
                "detailer_max_size": 1,
                "detailer_padding": 32,
                "detailer_blur": 10,
                "detailer_strength": 0.35,
                "detailer_models": [
                    "face-yolo8n"
                ],
                "refiner_steps": 20,
                "save_images": true,
                "alwayson_scripts": {
                    "recv toolbox": {
                        "args": [
                            false, "", "", "", "", "", "", "", "", "", "", "", "", "", "", false
                        ]
                    }
                }
            }

            const imageCreation = await fetch(`${process.env.LOCAL_SD_API}/txt2img`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sdData)
            });

            const returnedData = await imageCreation.json();

            image = returnedData["images"][0]
            const usedPrompt = JSON.parse(returnedData["info"])["prompt"]
            let imageData = { prompt: usedPrompt, image: image }
            return imageData
        } catch (error) {
            console.error('Error calling SD:', error);
        }
    }
}

export default generatorRouter;
