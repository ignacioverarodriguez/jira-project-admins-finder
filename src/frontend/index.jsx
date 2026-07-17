import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text,
  Spinner,
  Lozenge,
  SectionMessage,
  Stack,
  Inline,
  EmptyState,
  Select,
  Label,
  DynamicTable,
  Button,
} from '@forge/react';
import { invoke, router, view } from '@forge/bridge';

const App = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [admins, setAdmins] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState(null);
  const [siteUrl, setSiteUrl] = useState(null);

  useEffect(() => {
    invoke('getProjects')
      .then(setProjects)
      .catch(err => setError(String(err)))
      .finally(() => setLoadingProjects(false));

    view.getContext().then(context => setSiteUrl(context.siteUrl));
  }, []);

  const handleProjectChange = async (option) => {
    setSelectedProject(option);
    setAdmins(null);
    setError(null);
    setLoadingAdmins(true);
    try {
      const data = await invoke('getProjectAdmins', { projectKey: option.value });
      setAdmins(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingAdmins(false);
    }
  };

  const renderAdmins = () => {
    if (!selectedProject) return (
      <Text>Select a project above to see its administrators.</Text>
    );
    if (loadingAdmins) return (
      <Stack alignInline="center" space="space.200">
        <Spinner size="large" />
        <Text>Loading admins...</Text>
      </Stack>
    );
    if (error) return (
      <SectionMessage appearance="error" title="Error">
        <Text>{error}</Text>
      </SectionMessage>
    );
    if (admins === null) return null;

    const { owner, admins: adminList = [] } = admins;

    const tableHead = {
      cells: [
        { key: 'name', content: 'Name', isSortable: true, width: 25 },
        { key: 'email', content: 'Email', isSortable: true, width: 38 },
        { key: 'roles', content: '', width: 22 },
        { key: 'action', content: '', width: 15 },
      ],
    };

    const ownerIsAdmin = owner && adminList.some(a => a.accountId === owner.accountId);

    const requestButton = (email) => email && email !== '—' ? (
      <Button appearance="primary" onClick={() => {
        const projectUrl = siteUrl ? `${siteUrl}/jira/projects/${selectedProject.value}/summary` : '';
        const subject = encodeURIComponent(`Access request: ${selectedProject.label}`);
        const body = encodeURIComponent(`Hi,\n\nI would like to request access to the following Jira project:\n\n${selectedProject.label}${projectUrl ? `\n${projectUrl}` : ''}\n\nCould you please grant me the necessary permissions?\n\nThank you`);
        router.open(`mailto:${email}?subject=${subject}&body=${body}`);
      }}>
        Request access
      </Button>
    ) : null;

    const ownerRow = owner && !ownerIsAdmin ? [{
      key: owner.accountId,
      _isOwner: true,
      cells: [
        { key: 'name', content: <Text>{owner.displayName}</Text> },
        { key: 'email', content: <Text>{owner.email || '—'}</Text> },
        { key: 'roles', content: <Lozenge appearance="default">Project Lead</Lozenge> },
        { key: 'action', content: requestButton(owner.email) },
      ],
    }] : [];

    const adminRows = adminList.map(admin => {
      const isOwner = owner && admin.accountId === owner.accountId;
      return {
        key: admin.accountId,
        _isOwner: isOwner,
        cells: [
          { key: 'name', content: <Text>{admin.displayName}</Text> },
          { key: 'email', content: <Text>{admin.email}</Text> },
          {
            key: 'roles',
            content: <Lozenge appearance="default">{isOwner ? 'Project Lead' : 'Project Admin'}</Lozenge>,
          },
          { key: 'action', content: requestButton(admin.email) },
        ],
      };
    });

    const rows = [...ownerRow, ...adminRows].sort((a, b) => b._isOwner - a._isOwner);

    if (!rows.length) return (
      <EmptyState
        header="No individual admins found"
        description="This project's Administrator role has no individual users assigned — only groups."
      />
    );

    return <DynamicTable head={tableHead} rows={rows} />;
  };

  return (
    <Stack space="space.400">
      <SectionMessage appearance="information">
        <Text>Find out who the Project Administrators are for any project on this site, even if you don't have access to it.</Text>
      </SectionMessage>
      <Stack space="space.100">
        <Label labelFor="project-select">Project</Label>
        <Select
          inputId="project-select"
          options={projects}
          value={selectedProject}
          onChange={handleProjectChange}
          placeholder="Search for a project..."
          isLoading={loadingProjects}
        />
      </Stack>
      {renderAdmins()}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
