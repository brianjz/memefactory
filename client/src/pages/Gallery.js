import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import styled from 'styled-components';

const StyledThumb = styled(Card.Img)`
    width: 200px;
    height: auto;
    margin: 5px;
    cursor: pointer;

    @media (max-width: 768px) {
        width: 150px;
    }
`

function GalleryPage() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 12; 
  const topRef = useRef(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/savedimages'); // Your API endpoint
        const data = await response.json();
        setImages(data.files); // Assuming the JSON has a 'files' property
        if (data.files.length > 0) {
          setSelectedImage(data.files[0]);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages(); 
  }, []);

  const handleThumbnailClick = (image) => {
    setSelectedImage(image);
    topRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const parseDate = (dateString) => {
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    const hours = dateString.slice(8, 10);
    const minutes = dateString.slice(10, 12);
    const seconds = dateString.slice(12, 14);
  
    const date = new Date(year, month - 1, day, hours, minutes, seconds); // Month is 0-indexed
    return date.toLocaleDateString();
  }

  // Logic for pagination
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = images.slice(indexOfFirstImage, indexOfLastImage);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(images.length / imagesPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="text-center" ref={topRef}>
      {selectedImage && (
        <img
          src={`${process.env.REACT_APP_SAVED_DIR}${selectedImage}`}
          alt={selectedImage}
          style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
        />
      )}

      <div className="justify-content-center" style={{ display: 'flex', flexWrap: 'wrap', marginTop: '20px' }}>
        {currentImages.map(image => (
            <Card bg="dark" style={{ margin: '3px' }}>
                <StyledThumb
                    variant="top"
                    key={image}
                    src={`${process.env.REACT_APP_SAVED_DIR}${image}`}
                    alt={image}
                    onClick={() => handleThumbnailClick(image)}
                />
                <Card.Body>
                {(() => {
                    const imageName = image.split('-')[0].replace('.jpg','');
                    const displayDate = parseDate(imageName)
                    return (
                    <Card.Title>
                        <p style={{ color: 'white', fontSize: '0.7em' }}>{displayDate}</p>
                    </Card.Title>
                    );
                })()}
                </Card.Body>
          </Card>
        ))}
      </div>

      <ul className="pagination justify-content-center mt-3">
        {pageNumbers.map((number, index) => {
            if (
            number === 1 || 
            number === pageNumbers.length || 
            (index >= currentPage - 2 && index <= currentPage + 2)
            ) {
            return (
                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                <button onClick={() => handlePageChange(number)} className="page-link">
                    {number}
                </button>
                </li>
            );
            } else if (
            (index === currentPage - 3 && currentPage > 4) || 
            (index === currentPage + 3 && currentPage < pageNumbers.length - 3)
            ) {
            return (
                <li key={number} className="page-item disabled">
                <button className="page-link">...</button> 
                </li>
            );
            } else {
            return null; // Don't render the page number
            }
        })}
        </ul>
    </div>
  );
}

export default GalleryPage;