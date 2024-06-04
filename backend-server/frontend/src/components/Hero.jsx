import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Hero = () => {
  const [currentId, setCurrentId] = useState(0);
  const [content, setContent] = useState('Loading...');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [completedLessons, setCompletedLessons] = useState([]);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/users/get/german/content',
          { id: currentId },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        setContent(response.data);
      } catch (error) {
        console.error('Error fetching content:', error);
        setContent('Error fetching content. Please try again later.');
      }
    };
    fetchContent();
  }, [currentId]);

  useEffect(() => {
    const fetchCompletedLessons = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const response = await axios.post(
          'http://localhost:5000/api/users/fetch/given/user/completed/lessons',
          { "_id": userInfo._id },
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        setCompletedLessons(response.data.completedLessons);
      } catch (error) {
        console.error('Error fetching completed lessons:', error);
      }
    };
    fetchCompletedLessons();
  }, []);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  };

  const handleSendChat = async () => {
    if (chatInput.trim() === '') {
      console.log('Empty chat input, not sending request.');
      return;
    }

    try {
      const response = await axios.post(
        'http://127.0.0.1:5005/get-answer',
        { query: chatInput },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const newMessage = { type: 'user', text: chatInput };
      const botResponse = { type: 'bot', text: response.data.answer || "Sorry, I couldn't process that." };
      setChatMessages(prevMessages => [...prevMessages, newMessage, botResponse]);
      setChatInput('');
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const handleChatInputChange = (event) => {
    setChatInput(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendChat();
    }
  };

  const toggleLessonCompletion = async (lessonId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.post(
        'http://localhost:5000/api/users/store/user/completed/lessons',
        { "_id": userInfo._id, id: lessonId },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const response = await axios.post(
        'http://localhost:5000/api/users/fetch/given/user/completed/lessons',
        { "_id": userInfo._id },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setCompletedLessons(response.data.completedLessons);

      window.location.reload();
    } catch (error) {
      console.error('Error toggling lesson completion:', error);
    }
  };

  const isLessonCompleted = () => {
    return completedLessons.includes(currentId);
  };

  // Check if _id exists in userInfo to determine whether to render content
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (!userInfo || !userInfo._id) {
    return <div>Please login to view this page.</div>;
  }

  return (
    <div style={{ minHeight: '90vh', margin: '20px auto', padding: '2%', maxWidth: '95%', backgroundColor: '#f0f0f0', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', display: 'flex' }}>
      <div style={{ width: '60%', overflowY: 'auto', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginRight: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ color: '#333' }}>{typeof content === 'string' ? content : content.unit_name}</h2>
          <div style={{ cursor: 'pointer', color: isLessonCompleted() ? 'green' : 'gray', fontSize: '24px' }} onClick={() => toggleLessonCompletion(currentId)}>
            {isLessonCompleted() ? '✔️' : '□'}
          </div>
        </div>
        {typeof content !== 'string' && (
          <>
            <p>Learning Level: {content.level}</p>
            {content.learning_content.map((item, index) => (
              <details key={index} style={{ marginBottom: '15px', padding: '10px', borderRadius: '4px', backgroundColor: '#eee' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{item.title}</summary>
                <div dangerouslySetInnerHTML={{ __html: item.content }} />
              </details>
            ))}
          </>
        )}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setCurrentId(prevId => Math.max(0, prevId - 1))} style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', border: 'none' }}>Previous</button>
          <button onClick={() => setCurrentId(prevId => prevId + 1)} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', border: 'none' }}>Next</button>
        </div>
      </div>
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div ref={chatContainerRef} style={{ height: '70vh', overflowY: 'auto', flexGrow: 0, marginBottom: '20px' }}>
          {chatMessages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '10px', color: msg.type === 'user' ? '#007bff' : '#28a745' }}>{msg.text}</div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input type="text" value={chatInput} onChange={handleChatInputChange} onKeyDown={handleKeyDown} placeholder="Ask something..." style={{ flexGrow: 1, marginRight: '10px', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da' }} />
          <button onClick={handleSendChat} style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'white', borderRadius: '4px', border: 'none' }}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
