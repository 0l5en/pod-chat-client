import { Button } from 'react-bootstrap';
import { FaQuestion, FaSignOutAlt, FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { solidLogout, useSolidAuth } from '../../store/SolidAuthSlice';
import DashboardProfileHeader from './DashboardProfileHeader';
import WithTooltip from './WithTooltip';

const UserAuth = () => {
    const { webid } = useSolidAuth();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        dispatch(solidLogout());
    }

    return (
        <div className="d-flex align-items-center">
            {webid
                ? <>
                    <DashboardProfileHeader nameOnHover={true} />
                    <WithTooltip tooltipMessage="Logout"><Button onClick={handleLogout} className="shadow-none">
                        <FaSignOutAlt className='mb-1' />
                    </Button></WithTooltip>
                </>
                : <>
                    <Button title={"Registration"} variant="link" onClick={() => navigate('/register')}><FaUserPlus size={28} /></Button>
                    <Button title={"Help"} variant="link" onClick={() => navigate('/help')}><FaQuestion size={23} /></Button>
                </>
            }
        </div >
    );
};


export default UserAuth;