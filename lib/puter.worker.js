const PROJECT_PREFIX = 'roomify_project_';

const jsonError = (status, message, extra = {}) => {
   return new Response(JSON.stringify({ error: message, ...extra }), {
      status,
      headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*',
      },
   });
};

const getUserId = async (userPuter) => {
   try {
      const user = await userPuter.auth.getUser();
      return user?.uuid || null;
   } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
   }
};

router.post('/api/project/save', async ({ request, user }) => {
   try {
      const userPuter = user.puter;
      if (!userPuter) return jsonError(401, 'Unauthorized');
      const body = await request.json();
      const project = body?.project;
      if (!project?.id || project?.sourceImage) return jsonError(400, 'Project not found');
      const payload = {
         ...project,
         updatedAt: new Date().toISOString(),
      };

      const userId = await getUserId(userPuter);
      if (!userId) return jsonError(401, 'Unauthorized');

      const key = `${PROJECT_PREFIX}${project.id}`;
      await userPuter.kv.set(key, payload);

      return { saved: true, id: project.id, project: payload };
   } catch (error) {
      console.error('Failed to save project:', error);
      return jsonError(500, 'Failed to save project', {
         message: error.message || 'Unknown error',
      });
   }
});

router.get('/api/projects/list', async ({ user }) => {
   try {
      const userPuter = user.puter;
      if (!userPuter) return jsonError(401, 'Unauthorized');

      const keys = await userPuter.kv.list(PROJECT_PREFIX + '*');
      const values = await Promise.all(keys.map((key) => userPuter.kv.get(key)));
      const projects = values.filter((v) => v != null);

      return { projects };
   } catch (error) {
      console.error('Failed to list projects:', error);
      return jsonError(500, 'Failed to list projects', {
         message: error?.message || 'Unknown error',
      });
   }
});

router.get('/api/projects/get', async ({ request, user }) => {
   try {
      const userPuter = user.puter;
      if (!userPuter) return jsonError(401, 'Unauthorized');

      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) return jsonError(400, 'Missing id');

      const key = `${PROJECT_PREFIX}${id}`;
      const project = await userPuter.kv.get(key);
      if (project == null) return jsonError(404, 'Project not found');

      return { project };
   } catch (error) {
      console.error('Failed to get project:', error);
      return jsonError(500, 'Failed to get project', {
         message: error?.message || 'Unknown error',
      });
   }
});
