import puter from '@heyputer/puter.js';
import { getOrCreateHostingConfig, uploadImageToHosting } from './puter.hosting';
import { isHostedUrl } from './utils';
import { PUTER_WORKER_URL } from './constants';

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
   try {
      return await puter.auth.getUser();
   } catch {
      return null;
   }
};

export const createProject = async ({
   item,
   visibility = 'private',
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
   if (!PUTER_WORKER_URL) {
      console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
      return null;
   }
   const projectId = item.id;

   const hosting = await getOrCreateHostingConfig();

   const hostedSource = projectId
      ? await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: 'source' })
      : null;

   const renderImageUrl = item.renderedImage ?? (item as { renderImage?: string }).renderImage;
   const hostedRender =
      projectId && renderImageUrl
         ? await uploadImageToHosting({
              hosting,
              url: renderImageUrl,
              projectId,
              label: 'rendered',
           })
         : null;

   const resolvedSource =
      hostedSource?.url || (isHostedUrl(item.sourceImage) ? item.sourceImage : '');

   if (!resolvedSource) {
      console.warn('Failed to host source image, skipping save.');
      return null;
   }

   let resolvedRender: string | undefined;
   if (hostedRender?.url) resolvedRender = hostedRender.url;
   else if (renderImageUrl && isHostedUrl(renderImageUrl)) resolvedRender = renderImageUrl;
   else resolvedRender = undefined;

   const payload = {
      id: item.id,
      name: item.name ?? null,
      sourceImage: resolvedSource,
      renderedImage: resolvedRender ?? undefined,
      timestamp: item.timestamp,
      ownerId: item.ownerId ?? null,
      isPublic: item.isPublic ?? false,
      visibility,
   };

   try {
      const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
         method: 'POST',
         body: JSON.stringify({
            project: payload,
            visibility,
         }),
      });

      if (!response.ok) {
         console.error('failed to save the project', await response.text());
         return null;
      }

      const data = (await response.json()) as { project?: DesignItem | null };

      return data?.project ?? null;
   } catch (e) {
      console.log('Failed to save project', e);
      return null;
   }
};

export const getProjects = async () => {
   if (!PUTER_WORKER_URL) {
      console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
      return [];
   }

   try {
      const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, {
         method: 'GET',
      });

      if (!response.ok) {
         console.error('Failed to fetch history', await response.text());
         return [];
      }

      const data = (await response.json()) as { projects?: DesignItem[] | null };

      return Array.isArray(data?.projects) ? data?.projects : [];
   } catch (e) {
      console.error('Failed to get projects', e);
      return [];
   }
};

export const getProjectById = async ({ id }: { id: string }) => {
   if (!PUTER_WORKER_URL) {
      console.warn('Missing VITE_PUTER_WORKER_URL; skipping project fetch.');
      return null;
   }

   console.log('Fetching project with ID:', id);

   try {
      const response = await puter.workers.exec(
         `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
         { method: 'GET' },
      );

      console.log('Fetch project response:', response);

      if (!response.ok) {
         console.error('Failed to fetch project:', await response.text());
         return null;
      }

      const data = (await response.json()) as {
         project?: DesignItem | null;
      };

      console.log('Fetched project data:', data);

      return data?.project ?? null;
   } catch (error) {
      console.error('Failed to fetch project:', error);
      return null;
   }
};
