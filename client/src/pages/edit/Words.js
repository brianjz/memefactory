import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, InputGroup, Form } from 'react-bootstrap';
import styled from 'styled-components';

const MainTable = styled.table`

`

function EditWordsPage() {
    const [data, setData] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ 
        word: '', 
        wordtype: '' ,
        useInPrompt: 1
    });

    useEffect(() => {
        const fetchData = async () => {
        try {
            const response = await fetch('/api/words');
            const jsonData = await response.json();
            setData(jsonData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();
}, []);

const handleNewItemClick = () => {
    setNewItem({ word: '', wordtype: '', useInPrompt: 1 });
};

const handleNewItemChange = (event) => {
    const { name, value, type, checked } = event.target;
    setNewItem(prevItem => ({
        ...prevItem,
        [name]: type === 'checkbox' ? checked : value, 
    }));
};

const handleEditClick = (item) => {
    setEditingItem(item);   
};

const handleCancelClick = (item) => {
    setEditingItem(null);   
};

const handleInputChange = (event) => {
    setEditingItem(prevItem => ({
        ...prevItem,
        [event.target.name]: event.target.value,
    }));
};

const handleSaveClick = async () => {
    try {
        const response = await fetch('/api/word/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(editingItem),
        });

        if (response.ok) {
            // Update the data in the state
            setData(prevData => prevData.map(item => 
                item.id === editingItem.id ? editingItem : item 
            ));
            setEditingItem(null); 
        } else {
            console.error('Error updating data:', response.status);
        }
    } catch (error) {
        console.error('Error updating data:', error);
    }
};

const handleCreateClick = async () => {
    try {
        const dataToSend = {
            ...newItem,
            flagged: newItem.flagged ? 1 : 0,
        };

        const response = await fetch('/api/word/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
            const createdItem = await response.json();  

            setData([...data, createdItem]);
            setNewItem({ name: '', value: '' });
        } else {
            console.error('Error creating data:', response.status);
        }
        handleNewItemClick()
    } catch (error) {
        console.error('Error creating data:', error);
    }
};


return (
<Container data-bs-theme="dark">
    <Row>
    <Col md="12" className="mb-2">
        <MainTable className="table table-striped" data-bs-theme="dark">
            <thead>
                <tr>
                    <th></th> 
                    <th>Word</th>
                    <th>Word Type</th>
                    <th>Use In Prompt</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id}>
                        <td>
                            {editingItem?.id === item.id ? (
                                <>
                                <button onClick={handleSaveClick}>Save</button>
                                <button onClick={handleCancelClick}>Cancel</button>
                                </>
                            ) : (
                                <button onClick={() => handleEditClick(item)}>Edit</button>
                            )}
                        </td>
                        <td>
                            {editingItem?.id === item.id ? (
                                <input type="text" name="word" value={editingItem.word} onChange={handleInputChange} />
                            ) : (
                                item.word
                            )}
                        </td>
                        <td>
                            {editingItem?.id === item.id ? (
                                <input type="text" name="wordtype" value={editingItem.wordtype} onChange={handleInputChange} />
                            ) : (
                                item.wordtype
                            )}
                        </td>
                        <td>
                            {editingItem?.id === item.id ? (
                                <input type="number" max="1" min="0" style={{width: "50px"}} name="useInPrompt" value={editingItem.useInPrompt} onChange={handleInputChange} />
                            ) : (
                                item.useInPrompt === 0 ? "No" : "Yes"
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </MainTable>

        <h2>Add New Item</h2>
        <Card>
            <Card.Body>
                <Col md="12">
                <InputGroup className="mb-3">
                <Form.Control name="word" value={newItem.word} onChange={handleNewItemChange} placeholder="Word" />
                <Form.Control name="wordtype" value={newItem.wordtype} onChange={handleNewItemChange} placeholder="Word Type" />
                <button onClick={handleCreateClick}>Create</button>
                </InputGroup>
                </Col>
                <Col md="3">
                <Form.Check
                    type="switch"
                    id="new-useInPrompt"
                    name="useInPrompt"
                    label="Use In Prompt?"
                    checked={newItem.useInPrompt}
                    onChange={handleNewItemChange}
                    className="mx-2"
                />
                </Col>
            </Card.Body>
        </Card>
    </Col>
    </Row>
</Container>
    );
}

export default EditWordsPage;