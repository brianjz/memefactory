import { useState, useEffect, useRef } from "react";
import { addTextToImage } from '../utlities/imageUtils';
import { getPrompt, generateImage, getRandomSavedFile } from '../utlities/api';
import { getQueryStringParameter } from "../utlities/general";
import { Button, Container, Row, Col, Form, Offcanvas, Modal, ProgressBar, ListGroup, Dropdown } from 'react-bootstrap';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css'

const StyledImage = styled.img`
    width: 968px;

    @media (max-width: 768px) {
        width: 100%;
    }

    &.loading {
        filter: blur(8px);
    }
`;

const StyledOffcanvas = styled(Offcanvas)`
    background-color: #111;
    color: #eee;

    & .btn-close {
        --bs-btn-close-color: #ccc;
        color: var(--bs-btn-close-color);
        background-color: #666;
    }
    & .formHelp {
        color: #666 !important;
        font-size: 0.7em;
        line-height: 0.4em;
    }
`;

const StyledModal = styled(Modal)`
    & .modal-content {
        background-color: #666;
        color: #eee;
    }
`;

const StyledProgressBar = styled(ProgressBar)`
    width: 968px;
    height: 25px;
    margin: 5px auto;

    @media (max-width: 768px) {
        width: 100%;
    }
`

const InfoListGroup = styled(ListGroup)`
    justify-content: center;
    font-size: 0.75em;

    & #settings-button {
        width: inherit;
    }

    & > .list-group-item {
        cursor: pointer;

        &:hover {
            background-color: #666;
        }
    }


    @media (max-width: 768px) {
        font-size: 0.7em;
    }
`

const HomePage = () => {
    const [imageData, setImageData] = useState("default.png");
    const [originalImage, setOriginalImage] = useState("");
    const [generatedPrompt, setGeneratedPrompt] = useState('N/A')
    const [generatedSeed, setGeneratedSeed] = useState(-1)
    const [generatedCkpt, setGeneratedCkpt] = useState("")
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isOrigSaved, setIsOrigSaved] = useState(false);
    const [show, setShow] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [progress, setProgress] = useState(0)
    const [currentProcess, setCurrentProcess] = useState("")
    const [adMode, setADMode] = useState(false)

    const handleCloseModal = () => setShowModal(false);
    const handleShowModal = () => setShowModal(true);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    // eslint-disable-next-line no-unused-vars
    const [timings, setTimings] = useState({
        getPrompt: null,
        generateImage: null,
        total: null,
    });
    const startTimeRef = useRef(null);
    
    const [settings, setSettings] = useState({
        messageType: "message",
        messageOverride: '',
        seed: '-1',
        generator: 'flux',
        llm: 'local',
        checkpoint: '_current\\juggernaut_reborn',
        port: 22139
    });

    useEffect(() => {
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            setSettings(JSON.parse(storedSettings));
            settings.seed = -1
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const fetchRandomImage = async () => {
            const randomImage = await getRandomSavedFile("top");
            setImageData(process.env.REACT_APP_SAVED_DIR + randomImage);
            setIsLoading(false)
        };
        const ad = getQueryStringParameter("ad")
        const qryADMode = ad !== null
        setADMode(qryADMode)

        fetchRandomImage();

        const loadFont = async () => {
            const font = new FontFace('Impact Regular', 'url(impact.woff2)', {
                crossOrigin: 'anonymous'  // Add the crossorigin property here
            });
            await font.load();
            document.fonts.add(font); 
        }
        loadFont();
    }, []);

    useEffect(() => {
        localStorage.setItem('settings', JSON.stringify(settings));
    }, [settings]);

    const handleSettingChange = (event) => {
        const { name, value, type, checked } = event.target;
        setSettings(prevState => ({
            ...prevState, 
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleClick = async () => {
        if (isLoading) return;

        setTimings({
            getPrompt: null,
            generateImage: null,
            total: null,
        });

        startTimeRef.current = new Date();
        setIsLoading(true);
        resetForm()
        setProgress(0)
        setCurrentProcess(`Generating Message in ${settings.llm}...`)
        try {
            let seed = parseInt(settings.seed)
            if(seed === -1) {
                const min = 0;
                const max = Number.MAX_SAFE_INTEGER;
                
                seed = Math.floor(Math.random() * (max - min + 1)) + min;
            }
            setGeneratedSeed(seed)
            const generatorType = settings.generator
            const imageType = settings.messageType
            let useLLM = settings.llm !== "none"
            const promptStartTime = new Date();
            setProgress(33)
            const { prompt, includesBadWord, title, message} = await getPrompt(imageType, seed, settings.messageOverride, settings.llm, generatorType, adMode)
            if(!title) {
                throw new Error('Prompt Generation Failed')
            }
            let processExtended = ""
            if(includesBadWord) {
                // eslint-disable-next-line no-unused-vars
                useLLM = false
                processExtended = " Skipped LLM."
            }
            setCurrentProcess(`Generating Prompt in ${settings.llm}...`)
            const promptEndTime = new Date();

            setProgress(66)
            
            setCurrentProcess(`Generating Image in ${settings.generator}...`)
            const imageStartTime = new Date();
            const imageData = await generateImage(prompt, seed, generatorType, settings.checkpoint, settings.port, adMode)
            const imageEndTime = new Date();
            const image = imageData["image"]
            setGeneratedPrompt(imageData["prompt"])
            setGeneratedCkpt(imageData["checkpoint"])
            setProgress(95)
            setOriginalImage("data:image/jpeg;base64,"+image)
            addTextToImage(image, title, message, imageType, generatorType) 
            .then(processedBase64 => {
                setImageData(processedBase64);
            });
            const endTime = new Date();
            const totalTime = (endTime - startTimeRef.current) / 1000;
            const imageTime = (imageEndTime - imageStartTime) / 1000;
            const promptTime = (promptEndTime - promptStartTime) / 1000;

            setTimings({
                getPrompt: promptTime,
                generateImage: imageTime,
                total: totalTime,
            });

            setTimings(prevTimings => {
                const timingsText = ` Total ${prevTimings.total.toFixed(2)}s (LLM: ${prevTimings.getPrompt.toFixed(2)}s - Image: ${prevTimings.generateImage.toFixed(2)}s) ${processExtended}`;
                setProgress(100);
                setCurrentProcess(`Done!${timingsText}`);
                return prevTimings;
            });
            resetForm()
        } catch (error) {
            console.error('Error fetching data:', error);
            resetForm(true, error)
            setImageData("broken.jpg")
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = (isError = false, errorMessage = "") => {
        setProgress(100)
        if(isError) {
            setIsError(true)
            setCurrentProcess("Error: " + errorMessage)
        } else {
            setIsSaved(false)
            setIsOrigSaved(false)
            setIsError(false)
        }
    }

    const handleSaveImage = async (imageData, saveType) => {
        try {
            const response = await fetch('/api/save-image/'+saveType, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
            });
        
            const data = await response.json();
            if(data.message === "success") {
                if(saveType === "final") {
                    setIsSaved(true)
                } else {
                    setIsOrigSaved(true)
                }
            }
        // 'Image saved successfully'
        } catch (error) {
            console.error('Error saving image:', error);
        }
    }

    const sdModels = JSON.parse(process.env.REACT_APP_SD_MODELS);
    const sdOptions = Object.entries(sdModels).map(([key, value]) => (
        <option key={key} value={key}>
            {value}
        </option>
    ));

    return (
        <Container data-bs-theme="dark">
            <Row>
            <Col md="12" className="mb-2">
                <InfoListGroup horizontal id="info-list">
                    <ListGroup.Item id="settings-button" action as="button" onClick={handleShow}>
                        &laquo;&nbsp;Settings
                    </ListGroup.Item>
                    <ListGroup.Item className="pt-3" onClick={() => {
                        setSettings(prevState => ({
                            ...prevState,
                            messageType: settings.messageType === "meme" ? "message" : "meme",
                        }));
                    }}>{settings.messageType === "meme" ? "Meme" : "Motivational"}</ListGroup.Item>
                    <ListGroup.Item onClick={handleShow} className="text-center">{settings.generator}<br />{settings.llm}</ListGroup.Item>
                </InfoListGroup>
            </Col>
            <Col md="12" className="text-center" id="image-col">
                {imageData && (
                    <StyledImage src={`${imageData}`} id="rendered-image" className={`img-thumbnail ${isLoading ? 'loading' : ''}`}/>
                )}
                <StyledProgressBar variant={isError ? "danger" : isLoading ? "primary" : "success"} animated={isLoading} now={progress} label={currentProcess} />
            </Col>
            <Col md="12" className="text-center mt-2">
                <Button variant={adMode ? "outline-danger" : "primary"} onClick={handleClick} disabled={isLoading} className="mx-2">
                    {isLoading ? 'Hang Tight...' : 'Generate Image'}
                </Button>
                <Button variant={isSaved ? "success" : "outline-warning"} onClick={() => handleSaveImage(imageData, 'final')} disabled={isLoading}>
                    {isSaved ? 'SAVED!' : 'Save Image'}
                </Button>
            </Col>
            <Col md="12" className="text-center mt-2">
                <Button variant={isOrigSaved ? "success" : "outline-secondary"} className={"me-2" + (originalImage === "" ? " hidden" : "")} onClick={() => handleSaveImage(originalImage, 'orig')}>
                    {isOrigSaved ? 'SAVED!' : 'Save Original'}
                </Button>
                <Button variant="outline-info" href="/gallery" target="_blank">
                    Gallery
                </Button>
            </Col>
            </Row>            
            <StyledOffcanvas show={show} onHide={handleClose} scroll backdrop>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Settings</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Form.Label htmlFor="messageType">Type</Form.Label>
                    <Form.Select 
                        aria-label="Type"
                        id="messageType"
                        name="messageType"
                        value={settings.messageType}
                        onChange={handleSettingChange}
                    >
                        <option value="message">Motivational</option>
                        <option value="meme">Meme</option>
                    </Form.Select>

                    <Form.Label htmlFor="messageOverride">Message Override</Form.Label>
                    <Form.Control
                        type="text"
                        id="messageOverride"
                        name="messageOverride"
                        value={settings.messageOverride} 
                        onChange={handleSettingChange} 
                    />

                    <Form.Label htmlFor="generator">Image Generator</Form.Label>
                    <Form.Select 
                        aria-label="Image Generator"
                        name="generator"
                        value={settings.generator}
                        onChange={handleSettingChange}
                    >
                        <option value="flux">Flux</option>
                        <option value="sd15">Stable Diffusion 1.5</option>
                        <option value="comfy">ComfyUI</option>
                    </Form.Select>

                    <Form.Label htmlFor="llm">LLM Generator</Form.Label>
                    <Form.Select 
                        aria-label="LLM Generator"
                        name="llm"
                        value={settings.llm}
                        onChange={handleSettingChange}
                    >
                        <option value="none">None</option>
                        <option value="local">Local</option>
                        {!adMode && <option value="gemini">Gemini 1.5 Flash</option>}
                    </Form.Select>

                    <Form.Label htmlFor="generator">Checkpoint (non flux)</Form.Label>
                    <Form.Select 
                        aria-label="Checkpoint"
                        name="checkpoint"
                        value={settings.checkpoint}
                        onChange={handleSettingChange}
                    >
                        {sdOptions}
                    </Form.Select>

                    <Form.Label htmlFor="seed">Seed</Form.Label>
                    <Form.Control
                        type="text"
                        id="seed"
                        name="seed"
                        aria-describedby="seedHelpBlock"
                        value={settings.seed} 
                        onChange={handleSettingChange} 
                    />
                    <Form.Text className="formHelp" id="seedHelpBlock" muted>
                        This should get the same image again. Use -1 for random.
                    </Form.Text>

                    <Form.Label htmlFor="port">Runpod Port</Form.Label>
                    <Form.Control
                        type="text"
                        id="port"
                        name="port"
                        aria-describedby="portHelpBlock"
                        value={settings.port} 
                        onChange={handleSettingChange} 
                    />
                    <Form.Text className="formHelp" id="portHelpBlock" muted>
                        Runpod changes the TCP port on every restart.
                    </Form.Text>

                    <Button variant="primary" className="mt-2" onClick={handleShowModal}>
                        Generation Info
                    </Button>
                    <Dropdown className="mt-2">
                        <Dropdown.Toggle variant="primary" id="dropdown-edit">
                            Edit Data
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item href="/edit/memes" target="_blank">Memes</Dropdown.Item>
                            <Dropdown.Item href="/edit/messages" target="_blank">Messages</Dropdown.Item>
                            <Dropdown.Item href="/edit/words" target="_blank">Words</Dropdown.Item>
                            <Dropdown.Item href="/edit/lyrics" target="_blank">Lyrics</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Offcanvas.Body>
            </StyledOffcanvas>
            <StyledModal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                        <li>Prompt: {generatedPrompt}</li>
                        <li>Seed: {generatedSeed}</li>
                        <li>Checkpoint: {generatedCkpt}</li>
                    </ul>
                </Modal.Body>
            </StyledModal>
        </Container>
    )
}

export default HomePage;