import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();

async function getAllProjects() {
  const projects = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}`
    );
    const data = await response.json();
    projects.push(...(data.values || []));
    if (data.isLast) break;
    startAt += maxResults;
  }

  return projects;
}

async function fetchEmail(accountId) {
  try {
    const response = await api.asUser().requestJira(
      route`/rest/api/3/user?accountId=${accountId}`
    );
    const user = await response.json();
    return user.emailAddress || '—';
  } catch (e) {
    console.log('email fetch error:', String(e));
    return '—';
  }
}

resolver.define('getProjects', async () => {
  const projects = await getAllProjects();
  return projects.map(p => ({
    label: `${p.key} – ${p.name}`,
    value: p.key,
  }));
});

resolver.define('saveOrgToken', async ({ payload }) => {
  await kvs.set('org-api-token', payload.token);
  return { success: true };
});

resolver.define('getTokenStatus', async () => {
  const token = await kvs.get('org-api-token');
  const permResponse = await api.asUser().requestJira(
    route`/rest/api/3/mypermissions?permissions=ADMINISTER`
  );
  const perms = await permResponse.json();
  const isAdmin = perms.permissions?.ADMINISTER?.havePermission || false;
  return { hasToken: !!token, isAdmin };
});

resolver.define('getProjectAdmins', async ({ payload }) => {
  const { projectKey } = payload;

  const [rolesResponse, projectResponse] = await Promise.all([
    api.asApp().requestJira(route`/rest/api/3/project/${projectKey}/role`),
    api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`),
  ]);
  const roles = await rolesResponse.json();
  const project = await projectResponse.json();

  let owner = null;
  if (project.lead) {
    const email = await fetchEmail(project.lead.accountId);
    owner = {
      accountId: project.lead.accountId,
      displayName: project.lead.displayName,
      email,
    };
  }

  const adminRoleUrl = Object.entries(roles).find(
    ([name]) => name.toLowerCase() === 'administrator' || name.toLowerCase() === 'administrators'
  )?.[1];

  if (!adminRoleUrl) return { owner, admins: [] };

  const roleId = adminRoleUrl.split('/').pop();
  const roleResponse = await api.asApp().requestJira(
    route`/rest/api/3/project/${projectKey}/role/${roleId}`
  );
  const role = await roleResponse.json();

  const userActors = (role.actors || []).filter(
    actor => actor.type === 'atlassian-user-role-actor'
  );

  const admins = await Promise.all(
    userActors.map(async (actor) => {
      const accountId = actor.actorUser.accountId;
      const email = await fetchEmail(accountId);
      return {
        accountId,
        displayName: actor.displayName,
        email,
      };
    })
  );

  return { owner, admins };
});

export const handler = resolver.getDefinitions();
