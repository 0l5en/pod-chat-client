import { RouteObject, useRoutes } from 'react-router-dom';
import ViewHelp from './ViewHelp';
import ViewImprint from './ViewImprint';
import ViewMain from './ViewMain';
import ViewNotificationList from './ViewNotificationList';
import ViewRegister from './ViewRegister';
import ViewTC from './ViewTC';
import ChatCreatePanel from './components/ChatCreatePanel';
import ChatInvitationPanel from './components/ChatInvitationPanel';
import ChatInviterPanel from './components/ChatInviterPanel';
import ChatOutlet from './components/ChatOutlet';
import ChatPanel from './components/ChatPanel';
import ChatSettingsPanel from './components/ChatSettingsPanel';
import Layout from './components/Layout';

const routes: RouteObject[] = [{
    path: '/',
    element: <Layout />,
    children: [
        { path: '/imprint', element: <ViewImprint /> },
        { path: '/terms-and-conditions', element: <ViewTC /> },
        { path: '/register', element: <ViewRegister /> },
        { path: '/help', element: <ViewHelp /> },
        {
            path: '/*',
            element: <ViewMain chatPath='chat' />,
            children: [
                {
                    index: true,
                    element: <ViewNotificationList chatPath='chat' />
                },
                {
                    path: 'chat/new',
                    element: <ChatCreatePanel chatPath='../chat' />
                },
                {
                    path: 'chat/invitation',
                    element: <ChatInvitationPanel chatPath='../chat' backLink='..' />
                },
                {
                    path: 'chat/inviter',
                    element: <ChatInviterPanel chatPath='../chat' backLink='..' />
                },
                {
                    path: 'chat',
                    element: <ChatOutlet />,
                    children: [
                        {
                            index: true,
                            element: <ChatPanel settingsPath='settings' />
                        },
                        {
                            path: 'settings',
                            element: <ChatSettingsPanel backLink='..' />
                        }
                    ]
                },
            ]
        }
    ]
}];

const Routes = () => {
    const elem = useRoutes(routes);
    return <>{elem}</>
}

export default Routes;