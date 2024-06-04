// import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import { useEffect, useState } from 'react'; // Import useState
import axios from 'axios';

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [progressPercentage, setProgressPercentage] = useState(0); // State to hold progress percentage

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logoutApiCall] = useLogoutMutation();

  const fetchProgressPercentage = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await axios.post(
        'http://localhost:5000/api/users/get/user/progress/percentage',
        { "_id": userInfo._id },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setProgressPercentage(response.data.completionPercentage);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchProgressPercentage();
    }
  }, [userInfo]);

  const logoutHandler = async () => {
  try {

    // Assuming userInfo and chatMessages are available in localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const chatMessages = JSON.parse(localStorage.getItem('chatMessages'));

    if (userInfo && chatMessages) {
      const { _id } = userInfo;
      const userChatHistory = chatMessages;

      // Make a call to the endpoint using Axios
      await axios.post('http://localhost:5000/api/users/store/user/chat/history', {
        _id,
        userChatHistory
      });

      // Clear localStorage on successful update
      localStorage.removeItem('userInfo');
      localStorage.removeItem('chatMessages');
    }

    // Perform logout actions
    await logoutApiCall().unwrap();
    dispatch(logout());
    navigate('/login');
  } catch (err) {
    console.error(err);
  }
};

  return (
    <header>
      <Navbar bg='dark' variant='dark' expand='lg' collapseOnSelect>
        <Container>
          <LinkContainer to='/'>
            <Navbar.Brand>German Mastery</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto'>
              {userInfo ? (
                <>
                  <NavDropdown title={`${userInfo.name} (${progressPercentage.toFixed(1)}%)`} id='username'> {/* Display progress percentage in the dropdown title */}
                    <LinkContainer to='/profile'>
                      <NavDropdown.Item>Profile</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>
                      Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <LinkContainer to='/login'>
                    <Nav.Link>
                      <FaSignInAlt /> Sign In
                    </Nav.Link>
                  </LinkContainer>
                  <LinkContainer to='/register'>
                    <Nav.Link>
                      <FaSignOutAlt /> Sign Up
                    </Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
