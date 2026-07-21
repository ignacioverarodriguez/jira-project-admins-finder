# Jira Project Admins Finder

A Forge app for Atlassian Jira that displays project administrators and their email addresses. Quickly identify who manages each project and send access requests via email.

## Features

- 👥 **View Project Admins** — See all administrators for any Jira project
- 📧 **Email Addresses** — Display email addresses of project leads and admins
- 📬 **Quick Email Request** — One-click button to send access requests
- 🔐 **Secure** — Uses native Jira API, no external credentials needed

## Installation

1. Clone this repository
2. Run `npm install`
3. Deploy to your Jira instance:
   ```bash
   forge deploy
   ```
4. Install on your site:
   ```bash
   forge install --environment production
   ```

## Usage

1. Open the "Project Admins Finder" app from your Jira instance
2. Select a project from the dropdown
3. View the list of administrators and their email addresses
4. Click "Request access" to send an email to any administrator

## Development

### Local Development

```bash
# Start local development proxy
forge tunnel

# In another terminal, install on sandbox
forge install --environment development

# View logs
forge logs --environment development
```

### Project Structure

```
src/
  frontend/
    index.jsx          # React UI component
  resolvers/
    index.js           # Backend functions
manifest.yml           # App configuration
```

## API Endpoints Used

- `GET /rest/api/3/project/search` — List all projects
- `GET /rest/api/3/project/{key}/role` — Get project roles
- `GET /rest/api/3/project/{key}/role/{id}` — Get role members
- `GET /rest/api/3/user` — Get user details and email

## Permissions

The app requires the following scopes:
- `read:jira-work` — Read projects and issues
- `manage:jira-configuration` — Access project configuration
- `read:jira-user` — Read user information
- `storage:app` — Store app data (KVS)

## Technical Notes

### Why not use external Atlassian APIs?

Initially tried using the User Management API (`https://api.atlassian.com/users/{accountId}/manage/profile`), but **Forge apps cannot access external Atlassian APIs**. Only Jira REST API v3 endpoints (`/rest/api/3/*`) are available to Forge apps.

**Solution:** Use native Jira API `GET /rest/api/3/user?accountId={accountId}` which returns user email addresses without requiring external tokens.

## Requirements

- Node.js 22.x or 24.x
- Forge CLI
- Jira Cloud instance

## License

Private repository.
