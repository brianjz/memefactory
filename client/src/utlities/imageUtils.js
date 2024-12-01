import { createCanvas, loadImage } from 'canvas';

export async function addTextToImage(base64Image, mainTitleText, messageText, msgType) {
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
            ctx.font = '64px Times'; 
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
            let textSize = 60;
            let textWidth = await measureTextWidth(mainTitleText);
            while (textWidth > (newWidth - 10)) {
                textSize -= 1;
                ctx.font = `${textSize}px Times`;
                textWidth = await measureTextWidth(mainTitleText);
            }
        
            // Calculate text positions
            const textX = (newWidth - textWidth) / 2;
            const textY = originalHeight + borderSize + 65;
            ctx.fillText(mainTitleText, textX, textY);
        
            // Resize message text to fit
            ctx.font = '32px Times'; 
            let textSize2 = 32;
            let textWidth2 = await measureTextWidth(messageText);
            while (textWidth2 > (newWidth - 5)) {
                textSize2 -= 1;
                ctx.font = `${textSize2}px Times`;
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
            let topFontSize = 60;
            let bottomFontSize = 60;
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