import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { invoke } from '@tauri-apps/api/core';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { renderAsync } from 'docx-preview';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface FilePreviewProps {
  folderName: string;
  fileName: string;
}

export default function FilePreview({ folderName, fileName }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;

    const loadFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const bytes = await invoke<number[]>('read_client_file', {
          folderName,
          name: fileName,
        });

        if (!active) return;
        if (!bytes || bytes.length === 0) {
          throw new Error('File is empty or could not be read');
        }

        const uint8Array = new Uint8Array(bytes);
        const blob = new Blob([uint8Array], {
          type: fileName.toLowerCase().endsWith('.pdf')
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        if (fileName.toLowerCase().endsWith('.pdf')) {
          const loadingTask = pdfjs.getDocument({ data: uint8Array });
          const pdf = await loadingTask.promise;
          if (!active) return;

          const page = await pdf.getPage(1);
          if (!active) return;

          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport, canvas }).promise;
            }
          }
        } else if (fileName.toLowerCase().endsWith('.docx')) {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            await renderAsync(blob, containerRef.current);
          }
        }
      } catch (err) {
        console.error('Error loading file preview:', err);
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFile();

    return () => {
      active = false;
    };
  }, [folderName, fileName]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: 400,
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
          m: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography color="error" variant="h6" gutterBottom>
          Preview Failed
        </Typography>
        <Typography color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        bgcolor: 'grey.100',
        p: 2,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {fileName.toLowerCase().endsWith('.pdf') ? (
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            height: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            backgroundColor: 'white',
          }}
        />
      ) : (
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            maxWidth: '850px',
            bgcolor: 'white',
            p: 4,
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            minHeight: '100%',
          }}
        />
      )}
    </Box>
  );
}
