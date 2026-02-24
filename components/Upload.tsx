import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from 'lib/constants';

interface UploadProps {
   onComplete?: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
   const [file, setFile] = useState<File | null>(null);
   const [isDragging, setIsDragging] = useState(false);
   const [progress, setProgress] = useState(0);
   const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const base64ResultRef = useRef<string | null>(null);

   const { isSignedIn } = useOutletContext<AuthContext>();

   const scheduleComplete = () => {
      setTimeout(() => {
         const data = base64ResultRef.current;
         if (data) onComplete?.(data);
      }, REDIRECT_DELAY_MS);
   };

   const runProgressInterval = (base64: string) => {
      base64ResultRef.current = base64;
      progressIntervalRef.current = setInterval(() => {
         setProgress((prev) => {
            const next = Math.min(prev + PROGRESS_STEP, 100);
            if (next >= 100) {
               if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
               }
               scheduleComplete();
            }
            return next;
         });
      }, PROGRESS_INTERVAL_MS);
   };

   const processFile = (files: FileList | null) => {
      if (!isSignedIn || !files?.length) return;

      const selectedFile = files[0];
      setFile(selectedFile);
      setProgress(0);
      base64ResultRef.current = null;

      const reader = new FileReader();
      reader.onload = () => {
         const base64 = reader.result as string;
         runProgressInterval(base64);
      };
      reader.readAsDataURL(selectedFile);
   };

   const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSignedIn) setIsDragging(true);
   };

   const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
   };

   const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
   };

   const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isSignedIn) processFile(e.dataTransfer.files);
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSignedIn) return;
      processFile(e.target.files);
      e.target.value = '';
   };

   return (
      <div className="upload">
         {file ? (
            <div className="upload-status">
               <div className="status-content">
                  <div className="status-icon">
                     {progress === 100 ? (
                        <CheckCircle2 className="check" />
                     ) : (
                        <ImageIcon className="image" />
                     )}
                  </div>
                  <h3>{file?.name}</h3>
                  <div className="progress">
                     <div className="bar" style={{ width: `${progress}%` }} />
                     <p className="status-text">
                        {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                     </p>
                  </div>
               </div>
            </div>
         ) : (
            <section
               className={`dropzone ${isDragging ? 'is-dragging' : ''} ${isSignedIn ? '' : 'is-disabled'}`}
               aria-label="Upload drop zone"
               onDragEnter={handleDragEnter}
               onDragLeave={handleDragLeave}
               onDragOver={handleDragOver}
               onDrop={handleDrop}
            >
               <input
                  type="file"
                  className="drop-input"
                  accept=".jpg,.jpeg,.png"
                  disabled={!isSignedIn}
                  onChange={handleChange}
               />
               <div className="drop-content">
                  <div className="drop-icon">
                     <UploadIcon size={20} />
                  </div>
                  <p>
                     {isSignedIn
                        ? 'Click to upload or drag and drop your floor plan here'
                        : 'Please sign in to upload your floor plan'}
                  </p>
                  <p className="help">Maximum file size: 10MB</p>
               </div>
            </section>
         )}
      </div>
   );
};

export default Upload;
