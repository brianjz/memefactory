import { createCanvas, loadImage } from 'canvas';

export async function addTextToImage(base64Image, mainTitleText, messageText, msgType, generator) {
    // flux does 1024x768 and SD does 768x512, so font size looks different
    let messageTopTextSize = generator === "flux" ? 60 : generator == "zimage" ? 68 : 54
    let messageBottomTextSize = generator === "flux" ? 32 : generator == "zimage" ? 40 : 26
    let memeTextSize = generator === "flux" ? 60 : generator == "zimage" ? 72 : 54
    
    try {
        let processedBase64 = ""
        const dataURL = `data:image/jpeg;base64,${base64Image}`;
        const img = await loadImage(dataURL);
        if(msgType === "message") {
        
            const originalWidth = img.width;
            const originalHeight = img.height;
            const borderSize = 15;
        
            const newWidth = originalWidth + (borderSize * 2);
            const newHeight = originalHeight + (borderSize * 2) + 110;
        
            const canvas = createCanvas(newWidth, newHeight);
            const ctx = canvas.getContext('2d');
        
            // Fill with transparent background
            ctx.fillStyle = 'rgba(0, 0, 0, 0)'; 
            ctx.fillRect(0, 0, newWidth, newHeight);
        
            // Draw the image with a border
            ctx.drawImage(img, borderSize, borderSize, originalWidth, originalHeight);
        
            // Set up text styles (adjust font family and size as needed)
            ctx.font = messageTopTextSize+'px Times'; 
            ctx.fillStyle = 'white';
        
            // Function to measure text width
            async function measureTextWidth(text) {
              return new Promise(resolve => {
                // Ensure the font is set before measuring (if necessary)
                // For example, if you're loading a font:
                // document.fonts.ready.then(() => { 
                  resolve(ctx.measureText(text).width); 
                // });
              });
            }        
            // Resize main title text to fit
            let textWidth = await measureTextWidth(mainTitleText);
            while (textWidth > (newWidth - 10)) {
              messageTopTextSize -= 1;
                ctx.font = `${messageTopTextSize}px Times`;
                textWidth = await measureTextWidth(mainTitleText);
            }
        
            // Calculate text positions
            const textX = (newWidth - textWidth) / 2;
            const textY = originalHeight + borderSize + 65;
            ctx.fillText(mainTitleText, textX, textY);
        
            // Resize message text to fit
            ctx.font = messageBottomTextSize+'px Times'; 
            let textWidth2 = await measureTextWidth(messageText);
            while (textWidth2 > (newWidth - 5)) {
              messageBottomTextSize -= 1;
                ctx.font = `${messageBottomTextSize}px Times`;
                textWidth2 = await measureTextWidth(messageText);
            }
        
            // Calculate text positions
            const textX2 = (newWidth - textWidth2) / 2;
            const textY2 = originalHeight + borderSize + 105;
            ctx.fillText(messageText, textX2, textY2);

            processedBase64 = canvas.toDataURL('image/jpeg'); // Or 'image/png'
        } else if(msgType === "meme") {
            mainTitleText = mainTitleText.toUpperCase();
            messageText = messageText.toUpperCase();
            const width = img.width;
            const height = img.height;
        
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);  
        
        
            // Set up text parameters
            const topText = mainTitleText;
            const bottomText = messageText;
            let topFontSize = memeTextSize;
            let bottomFontSize = memeTextSize;
            ctx.fillStyle = 'white'; // Text color
            ctx.shadowColor = 'black'; // Shadow color
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 0;
            ctx.font = `${topFontSize}px Impact Regular`; 
        
            // Function to measure text width
            async function measureTextWidth(text) {
              return new Promise(resolve => {
                // Ensure the font is set before measuring (if necessary)
                // For example, if you're loading a font:
                document.fonts.ready.then(() => { 
                  resolve(ctx.measureText(text).width); 
                });
              });
            }        
        
            // Resize top text to fit
            let topTextWidth = await measureTextWidth(topText);
            while (topTextWidth > (width - 10)) {
              topFontSize = topFontSize - 1;
              ctx.font = `${topFontSize}px Impact Regular`;
              topTextWidth = await measureTextWidth(topText);
            }
            ctx.font = `${topFontSize}px Impact Regular`;
            const topTextX = (width - topTextWidth) / 2;
            const topTextY = topFontSize + 20; // Adjust vertical position as needed
        
            // Add text with shadow
            ctx.fillText(topText, topTextX, topTextY); 

            // Resize bottom text to fit
            ctx.font = `${bottomFontSize}px Impact Regular`;
            let bottomTextWidth = await measureTextWidth(bottomText);
            while (bottomTextWidth > (width - 10)) {
              bottomFontSize = bottomFontSize - 1;
              ctx.font = `${bottomFontSize}px Impact Regular`;
              bottomTextWidth = await measureTextWidth(bottomText);
            }
            ctx.font = `${bottomFontSize}px Impact Regular`;
            const bottomTextX = (width - bottomTextWidth) / 2;
            const bottomTextY = height - 20; // Adjust vertical position as needed

            ctx.fillText(bottomText, bottomTextX, bottomTextY); 
        
            // Convert canvas to base64
            processedBase64 = canvas.toDataURL('image/jpeg'); 
        }
  
      // Convert canvas to base64
      return processedBase64;
  
    } catch (err) {
      console.error("Add text error: " + err);
    }
}