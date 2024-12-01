export async function getPrompt(imageType, seed, override, llm = "local", generator, adMode) {
    // let messageResponse = {}
    const url = `/api/generator/getPrompt/${llm}/${generator}/${imageType}/${seed}`
    const messageResponse = await fetch(url, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({override: override, adMode: adMode})
    });

    return await messageResponse.json();
}

export async function getRandomPrompt(seed, generatorType = "sd15", adMode) {
    const messageResponse = await fetch('/api/random/prompt/'+generatorType+'/'+seed);

    const msg = await messageResponse.json()
    const prompt = (adMode ? `${process.env.REACT_APP_PROMPT_ADDITION}, ` : "") + msg.prompt

    return prompt
}

export async function getRandomSavedFile(sort = "random") {
    const messageResponse = await fetch('/api/random/savedimage/'+sort);

    const msg = await messageResponse.json()
    const file = msg.file

    return file
}

export async function generateImage(prompt, seed, generator = "sd15", checkpoint, port) {
    const url = `/api/generator/getImage/${generator}/${seed}`
    const messageResponse = await fetch(url, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({prompt: prompt, checkpoint: checkpoint, port: port})
    });

    return await messageResponse.json();

}