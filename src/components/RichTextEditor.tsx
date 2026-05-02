import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { locale } = useAppContext();
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        spellcheck: 'true',
        class: 'rich-text-editor',
      },
    },
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    isRecording,
    confirmedText,
    unstableText,
    startRecording,
    stopRecording,
    error: sttError,
  } = useSpeechToText();

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  const applyMark = (command: () => void) => {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      command();
      editor?.commands.focus();
    };
  };

  const toggleFullscreen = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsFullscreen((current) => !current);
  };

  const handleMicToggle = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isRecording) {
        const finalText = await stopRecording();
        if (finalText && editor) {
          // Append the transcribed text at the end of the current content
          editor.commands.focus('end');
          editor.commands.insertContent(finalText + ' ');
        }
      } else {
        await startRecording();
      }
    },
    [isRecording, startRecording, stopRecording, editor]
  );

  // Shared toolbar button group — reused in both normal and fullscreen modes
  const toolbar = (
    <ButtonGroup
      variant="outlined"
      size="small"
      aria-label="notes editor toolbar"
      sx={{
        borderColor: 'divider',
        '& .MuiButtonGroup-grouped': { borderColor: 'divider' },
        '& .MuiButtonGroup-grouped:not(:last-of-type)': { borderRightColor: 'divider' },
      }}
    >
      <Button
        onMouseDown={applyMark(() => editor?.chain().focus().toggleBold().run())}
        color={editor?.isActive('bold') ? 'primary' : 'inherit'}
      >
        <FormatBoldIcon fontSize="small" />
      </Button>
      <Button
        onMouseDown={applyMark(() => editor?.chain().focus().toggleItalic().run())}
        color={editor?.isActive('italic') ? 'primary' : 'inherit'}
      >
        <FormatItalicIcon fontSize="small" />
      </Button>
      <Button
        onMouseDown={applyMark(() => editor?.chain().focus().toggleBulletList().run())}
        color={editor?.isActive('bulletList') ? 'primary' : 'inherit'}
      >
        <FormatListBulletedIcon fontSize="small" />
      </Button>
      <Button
        onMouseDown={applyMark(() => editor?.chain().focus().toggleOrderedList().run())}
        color={editor?.isActive('orderedList') ? 'primary' : 'inherit'}
      >
        <FormatListNumberedIcon fontSize="small" />
      </Button>
      <Button onMouseDown={toggleFullscreen} color={isFullscreen ? 'primary' : 'inherit'}>
        {isFullscreen ? (
          <FullscreenExitIcon fontSize="small" />
        ) : (
          <FullscreenIcon fontSize="small" />
        )}
      </Button>
      <Tooltip title={isRecording ? t(locale, 'micStop') : t(locale, 'micStart')}>
        <Button
          id="rte-mic-button"
          onMouseDown={handleMicToggle}
          color={isRecording ? 'error' : 'inherit'}
          aria-label={isRecording ? 'stop recording' : 'start recording'}
          sx={
            isRecording
              ? {
                  animation: 'pulse 1.4s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }
              : undefined
          }
        >
          {isRecording ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
        </Button>
      </Tooltip>
    </ButtonGroup>
  );

  // Live transcription ghost text displayed below the editor while recording
  const ghostText =
    isRecording && (confirmedText || unstableText) ? (
      <Box
        sx={{
          px: 2,
          pb: 1,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {' '}
          {confirmedText && (
            <Box component="span" sx={{ opacity: 0.9 }}>
              {confirmedText}{' '}
            </Box>
          )}
          {unstableText && (
            <Box component="span" sx={{ opacity: 0.45 }}>
              {unstableText}
            </Box>
          )}
        </Typography>
      </Box>
    ) : null;

  // Error banner (e.g. mic permission denied)
  const errorBanner = sttError ? (
    <Box sx={{ px: 2, py: 0.5, bgcolor: 'error.light' }}>
      <Typography variant="caption" color="error.contrastText">
        {sttError}
      </Typography>
    </Box>
  ) : null;

  const editorContent = (
    <Box
      sx={{
        px: 2,
        py: 2,
        flexGrow: 1,
        overflowY: 'auto',
        '& .ProseMirror': {
          minHeight: 180,
          outline: 'none',
          fontSize: '0.95rem',
          lineHeight: 1.75,
          padding: 0,
        },
        '& .ProseMirror p': { margin: 0 },
        '& .ProseMirror p.is-editor-empty:first-child::before': {
          content: 'attr(data-placeholder)',
          float: 'left',
          height: 0,
          color: 'rgba(0, 0, 0, 0.38)',
          pointerEvents: 'none',
        },
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  );

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          {toolbar}
        </Box>
        {editorContent}
        {ghostText}
        {errorBanner}
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        flexGrow: 1,
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        {toolbar}
      </Box>
      {editorContent}
      {ghostText}
      {errorBanner}
    </Paper>
  );
}
