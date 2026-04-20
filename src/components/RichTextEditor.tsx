import { useEffect, type MouseEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
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
        <ButtonGroup
          variant="outlined"
          size="small"
          aria-label="notes editor toolbar"
          sx={{
            borderColor: 'divider',
            '& .MuiButtonGroup-grouped': {
              borderColor: 'divider',
            },
            '& .MuiButtonGroup-grouped:not(:last-of-type)': {
              borderRightColor: 'divider',
            },
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
        </ButtonGroup>
      </Box>
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
          '& .ProseMirror p': {
            margin: 0,
          },
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
    </Paper>
  );
}
