import tw from 'twin.macro';
import * as Icon from 'react-feather';
import { useLocation } from 'react-router';
import { useStoreState } from 'easy-peasy';
import Can from '@/components/elements/Can';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import TransitionRouter from '@/TransitionRouter';
import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { CSSTransition } from 'react-transition-group';
import SidePanel from '@/components/elements/SidePanel';
import Suspended from '@/components/elements/Suspended';
import useWindowDimensions from '@/plugins/useWindowDimensions';
import SubNavigation from '@/components/elements/SubNavigation';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import ExternalConsole from '@/components/server/ExternalConsole';
import InstallListener from '@/components/server/InstallListener';
import ServerRestoreSvg from '@/assets/images/server_restore.svg';
import PluginContainer from '@/components/server/PluginContainer';
import EditContainer from '@/components/server/edit/EditContainer';
import TransferListener from '@/components/server/TransferListener';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import RequireServerPermission from '@/hoc/RequireServerPermission';
import ServerInstallSvg from '@/assets/images/server_installing.svg';
import MobileNavigation from '@/components/elements/MobileNavigation';
import UsersContainer from '@/components/server/users/UsersContainer';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import BackupContainer from '@/components/server/backups/BackupContainer';
import FileEditContainer from '@/components/server/files/FileEditContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import ScreenBlock, { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import ServerConsoleContainer from '@/components/server/console/ServerConsoleContainer';
import ScheduleEditContainer from '@/components/server/schedules/ScheduleEditContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';

const ConflictStateRenderer = () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);

    return status === 'installing' || status === 'install_failed' ? (
        <ScreenBlock
            title={'Instalador em execução'}
            image={ServerInstallSvg}
            message={'Seu servidor deve estar pronto em breve, tente novamente em alguns minutos.'}
        />
    ) : status === 'suspended' ? (
        <Suspended />
    ) : (
        <ScreenBlock
            title={isTransferring ? 'Transferindo' : 'Restaurando Backup'}
            image={ServerRestoreSvg}
            message={
                isTransferring
                    ? 'Seu servidor está sendo transferido para um novo Node, verifique novamente mais tarde.'
                    : 'Seu servidor está sendo restaurado de um backup, verifique em alguns minutos.'
            }
        />
    );
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const { width } = useWindowDimensions();

    const [error, setError] = useState('');
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const databasesEnabled = useStoreState((state) => state.settings.data!.databases);
    const editEnabled = useStoreState((state) => state.storefront.data!.editing.enabled);

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    useEffect(() => {
        clearServerState();
    }, []);

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <React.Fragment key={'server-router'}>
            {width >= 1280 ? <SidePanel /> : <MobileNavigation />}
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <>
                    <CSSTransition timeout={150} classNames={'fade'} appear in>
                        <SubNavigation className={'j-down'}>
                            <div>
                                <NavLink to={`${match.url}`} exact>
                                    <div css={tw`flex items-center justify-between`}>
                                        Console <Icon.Terminal css={tw`ml-1`} size={18} />
                                    </div>
                                </NavLink>
                                <Can action={'activity.*'}>
                                    <NavLink to={`${match.url}/activity`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Atividades <Icon.Eye css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                {eggFeatures?.includes('eula') && (
                                    <Can action={'plugin.*'}>
                                        <NavLink to={`${match.url}/plugins`}>
                                            <div css={tw`flex items-center justify-between`}>
                                                Plugins <Icon.Box css={tw`ml-1`} size={18} />
                                            </div>
                                        </NavLink>
                                    </Can>
                                )}
                                <Can action={'file.*'}>
                                    <NavLink to={`${match.url}/files`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Arquivos <Icon.Folder css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                {databasesEnabled && (
                                    <Can action={'database.*'}>
                                        <NavLink to={`${match.url}/databases`}>
                                            <div css={tw`flex items-center justify-between`}>
                                                Bancos de dados <Icon.Database css={tw`ml-1`} size={18} />
                                            </div>
                                        </NavLink>
                                    </Can>
                                )}
                                <Can action={'schedule.*'}>
                                    <NavLink to={`${match.url}/schedules`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Tarefas <Icon.Clock css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                <Can action={'user.*'}>
                                    <NavLink to={`${match.url}/users`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Usuários <Icon.Users css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                <Can action={'backup.*'}>
                                    <NavLink to={`${match.url}/backups`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Backups <Icon.Archive css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                <Can action={'allocation.*'}>
                                    <NavLink to={`${match.url}/network`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Rede <Icon.Share2 css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                <Can action={'startup.*'}>
                                    <NavLink to={`${match.url}/startup`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Inicialização <Icon.Play css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                <Can action={['settings.*', 'file.sftp']} matchAny>
                                    <NavLink to={`${match.url}/settings`}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Definições <Icon.Settings css={tw`ml-1`} size={18} />
                                        </div>
                                    </NavLink>
                                </Can>
                                {editEnabled && (
                                    <Can action={['settings.*']} matchAny>
                                        <NavLink to={`${match.url}/edit`}>
                                            <div css={tw`flex items-center justify-between`}>
                                                Edit <Icon.Edit css={tw`ml-1`} size={18} />
                                            </div>
                                        </NavLink>
                                    </Can>
                                )}
                                {rootAdmin && (
                                    <a href={'/admin/servers/view/' + serverId} rel='noreferrer' target={'_blank'}>
                                        <div css={tw`flex items-center justify-between`}>
                                            Admin <Icon.ExternalLink css={tw`ml-1`} size={18} />
                                        </div>
                                    </a>
                                )}
                            </div>
                        </SubNavigation>
                    </CSSTransition>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    <Route path={`${match.path}`} component={ServerConsoleContainer} exact />
                                    <Route path={`${match.path}/console`} component={ExternalConsole} exact />
                                    <Route path={`${match.path}/files`} exact>
                                        <RequireServerPermission permissions={'file.*'}>
                                            <FileManagerContainer />
                                        </RequireServerPermission>
                                    </Route>
                                    <Route path={`${match.path}/activity`} exact>
                                        <RequireServerPermission permissions={'activity.*'}>
                                            <ServerActivityLogContainer />
                                        </RequireServerPermission>
                                    </Route>
                                    {eggFeatures?.includes('eula') && (
                                        <Route path={`${match.path}/plugins`} exact>
                                            <RequireServerPermission permissions={'plugin.*'}>
                                                <PluginContainer />
                                            </RequireServerPermission>
                                        </Route>
                                    )}
                                    <Route path={`${match.path}/files/:action(edit|new)`} exact>
                                        <Spinner.Suspense>
                                            <FileEditContainer />
                                        </Spinner.Suspense>
                                    </Route>
                                    {databasesEnabled && (
                                        <Route path={`${match.path}/databases`} exact>
                                            <RequireServerPermission permissions={'database.*'}>
                                                <DatabasesContainer />
                                            </RequireServerPermission>
                                        </Route>
                                    )}
                                    <Route path={`${match.path}/schedules`} exact>
                                        <RequireServerPermission permissions={'schedule.*'}>
                                            <ScheduleContainer />
                                        </RequireServerPermission>
                                    </Route>
                                    <Route path={`${match.path}/schedules/:id`} exact>
                                        <ScheduleEditContainer />
                                    </Route>
                                    <Route path={`${match.path}/users`} exact>
                                        <RequireServerPermission permissions={'user.*'}>
                                            <UsersContainer />
                                        </RequireServerPermission>
                                    </Route>
                                    <Route path={`${match.path}/backups`} exact>
                                        <RequireServerPermission permissions={'backup.*'}>
                                            <BackupContainer />
                                        </RequireServerPermission>
                                    </Route>
                                    <Route path={`${match.path}/network`} exact>
                                        <RequireServerPermission permissions={'allocation.*'}>
                                            <NetworkContainer />
                                        </RequireServerPermission>
                                    </Route>
                                    <Route path={`${match.path}/startup`} component={StartupContainer} exact />
                                    <Route path={`${match.path}/settings`} component={SettingsContainer} exact />
                                    {editEnabled && (
                                        <Route path={`${match.path}/edit`} component={EditContainer} exact />
                                    )}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </React.Fragment>
    );
};
