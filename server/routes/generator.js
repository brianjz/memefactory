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
            - Camera and Lens examples: "Canon EOS R5", "Nikon D850 with a macro lens", "35mm lens at f/8"
            - Film Stock examples: "Kodak film", "Fujifilm Provia"
            - Post-Processing examples: "Film grain", "lens aberration", "color negative", "bokeh."
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
    "bypass_eos": false
}

async function getMessage(imageType, seed, override, llm = "local", adMode) {
    let userPrompt = ""            
    let messageResponse = { message: override.toUpperCase(), "includesBadWord": false }
    const msg = await getRandomMessage(imageType, seed, override)
    console.log(`MSG ==> ${msg.title} | ${msg.outputString}`)

    const modifier = adMode ? `, ${process.env.LLM_PROMPT_ADDITION} ,` : ""
    const extra = msg.extra !== "" ? ` Prompt should also involve '${msg.extra}'` : ""
    if(llm === "local") {
        if(imageType === "meme") {
            let memeMsg = msg.outputString !== "" ? `${msg.title} ${msg.outputString}` : msg.title
            userPrompt = `${startsys}\n${sdPrompt}\n${startuser}\nCreate a prompt for the meme phrase${modifier}'${memeMsg}'.${extra}\n${ending}${startresp}\n`
        } else {
            userPrompt = `${startsys}\n${sdPrompt}\n${startuser}\nCreate a prompt for the an image based on the phrase${modifier}'${msg.title}' heavily affected by the phrase '${msg.outputString}.${extra}'\n${ending}${startresp}\n`
        }
    } else {
        if(imageType === "meme") {
            let memeMsg = msg.outputString !== "" ? `${msg.title} ${msg.outputString}` : msg.title
            userPrompt = `${sdPrompt}\nCreate a prompt for the meme phrase${modifier} '${memeMsg}'${extra}`
        } else {
            userPrompt = `${sdPrompt}\nCreate a prompt for the an image based on the phrase${modifier} '${msg.title}' heavily affected by the phrase '${msg.outputString}'${extra}`
        }
        userPrompt = userPrompt + " Do not use square brackets or curly brackets. Try not to use a surreal description."
    }

    let hasBadWord = msg.includesBadWord
    if(llm === "local" && adMode) {
        console.log("ADMODE => skipping bad word flag")
        hasBadWord = false
    }
    return {title: msg.title, message: msg.outputString, userPrompt, includesBadWord: hasBadWord}
}

async function buildPrompt(userPrompt, seed, generatorType = "flux", llm = "local") {
    llmData["seed"] = seed
    const promptExamples = generatorType === "flux" ? JSON.parse(process.env.FLUX_PROMPT_EXAMPLES) : JSON.parse(process.env.SD_PROMPT_EXAMPLES);
    let peString = generatorType === "flux" ? "Prompt Examples:\n" : "Prompt Examples (short, brief phrases separated by commas):\n"
    promptExamples.forEach(str => {
        peString += "- " + str + "\n";
    });
    userPrompt = userPrompt.replace("Prompt Examples:", peString)
    userPrompt = generatorType === "flux" ? userPrompt.replace("Stable Diffusion 1.5", "Flux") : userPrompt
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
            console.log("LOCAL LLM => "+finalPrompt);
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
            console.log("GEMINI => "+responseText);
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
        // console.log("MSG => "+messageData.userPrompt)
        let finalPrompt = "Error"
        if(!messageData.includesBadWord && llm !== "none") {
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
    const adMode = req.body.adMode && req.body.adMode !== 0
    try {
        // console.log(finalPrompt);
        const imageData = await generateImage(finalPrompt, seed, generator, checkpoint, port, adMode)

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

async function generateImage(finalPrompt, seed, generatorType = "flux", checkpoint, port, adMode = false) {
    let image = ""
    if(generatorType === "flux" || generatorType === "comfy") {
        try {
            if(generatorType === "flux") {
                finalPrompt = finalPrompt.replace(process.env.SD_PROMPT_ADDITION, "")
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
            const neg = adMode ? process.env.SD_PROMPT_NEGAD : process.env.SD_PROMPT_NEGATIVE
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
                "negative_prompt": neg,
                "seed": seed,
                "sampler_name": "DPM++ 2M SDE",
                "batch_size": 1,
                "steps": 25,
                "cfg_scale": 3.5,
                "clip_skip": 1,
                "width": "768",
                "height": "560",
                "detailer": true,
                "save_images_before_detailer": false,
                "detailer_model": "Detailer",
                "detailer_classes": "",
                "detailer_conf": 0.5,
                "detailer_max": 4,
                "detailer_iou": 0.5,
                "detailer_min_size": 0.05,
                "detailer_max_size": 1,
                "detailer_padding": 32,
                "detailer_blur": 10,
                "detailer_strength": 0.35,
                "detailer_models": [
                    "yolov8n-face"
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
            const info = returnedData["info"]
            const usedPrompt = JSON.parse(info)["prompt"]
            console.log("SD INFO => " + info)
            let imageData = { prompt: usedPrompt, image: image }
            return imageData
        } catch (error) {
            console.error('Error calling SD:', error);
        }
    }
}

export default generatorRouter;
