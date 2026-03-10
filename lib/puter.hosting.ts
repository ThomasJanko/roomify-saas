import puter from '@heyputer/puter.js';
import {
   createHostingSlug,
   fetchBlobFromUrl,
   getHostedUrl,
   getImageExtension,
   HOSTING_CONFIG_KEY,
   imageUrlToPngBlob,
   isHostedUrl,
} from './utils';

type HostingConfig = { subdomain: string };
type HostedAsset = { url: string };

export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
   const existingConfig = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

   if (existingConfig?.subdomain) return { subdomain: existingConfig.subdomain };
   const subdomain = createHostingSlug();

   try {
      const created = await puter.hosting.create(subdomain, '.');
      const record = { subdomain: created.subdomain };

      await puter.kv.set(HOSTING_CONFIG_KEY, record);

      return record;
   } catch (error) {
      console.warn(`Failed creating hosting config: ${error}`);
      return null;
   }
};

export const uploadImageToHosting = async ({
   hosting,
   url,
   projectId,
   label,
}: StoreHostedImageParams): Promise<HostedAsset | null> => {
   if (!hosting || !url) return null;
   if (isHostedUrl(url)) return { url };

   try {
      const result =
         label === 'rendered'
            ? await imageUrlToPngBlob(url).then((blob) =>
                 blob ? { blob, contentType: 'image/png' } : null,
              )
            : await fetchBlobFromUrl(url);

      if (!result) return null;

      const contentType = result.contentType || result.blob.type || '';
      const ext = getImageExtension(contentType, url);
      const dir = `projects/${projectId}`;
      const filePath = `${dir}/${label}.${ext}`;

      const uploadFile = new File([result.blob], `${label}.${ext}`, { type: contentType });

      await puter.fs.mkdir(dir, { createMissingParents: true });
      await puter.fs.write(filePath, uploadFile);

      const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);

      return hostedUrl ? { url: hostedUrl } : null;
   } catch (error) {
      console.warn(`Failed uploading image to hosting: ${error}`);
      return null;
   }
};
