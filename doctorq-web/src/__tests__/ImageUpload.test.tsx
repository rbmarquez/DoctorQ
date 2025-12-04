/**
 * Testes para o componente ImageUpload
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock do fetch
global.fetch = jest.fn();

describe('ImageUpload', () => {
  const mockOnUploadComplete = jest.fn();
  const mockUserId = 'test-user-id';
  const mockAlbumId = 'test-album-id';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render upload area correctly', () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
      />
    );

    expect(screen.getByText(/arraste uma imagem/i)).toBeInTheDocument();
    expect(screen.getByText(/ou clique para selecionar/i)).toBeInTheDocument();
  });

  it('should display file size limit', () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
        maxSizeMB={10}
      />
    );

    expect(screen.getByText(/m\u00e1ximo: 10 mb/i)).toBeInTheDocument();
  });

  it('should show preview when file is selected', async () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
      />
    );

    // Create mock file
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,mock',
    };

    global.FileReader = jest.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText(/arraste uma imagem/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Trigger FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mock' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });
  });

  it('should reject files that are too large', async () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
        maxSizeMB={1}
      />
    );

    // Create file larger than 1MB
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const input = screen.getByLabelText(/arraste uma imagem/i);
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('muito grande')
      );
    });
  });

  it('should reject invalid file types', async () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
        acceptedTypes={['image/jpeg', 'image/png']}
      />
    );

    const invalidFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });

    const input = screen.getByLabelText(/arraste uma imagem/i);
    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('tipo de arquivo')
      );
    });
  });

  it('should call onUploadComplete when upload succeeds', async () => {
    const mockResponse = {
      id_foto: 'foto-123',
      ds_caminho: '/uploads/test.jpg',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,mock',
    };

    global.FileReader = jest.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText(/arraste uma imagem/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for preview
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mock' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText(/fazer upload/i)).toBeInTheDocument();
    });

    // Click upload button
    const uploadButton = screen.getByText(/fazer upload/i);
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockResponse);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should show error toast when upload fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Upload failed' }),
    });

    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,mock',
    };

    global.FileReader = jest.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText(/arraste uma imagem/i);
    fireEvent.change(input, { target: { files: [file] } });

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mock' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText(/fazer upload/i)).toBeInTheDocument();
    });

    const uploadButton = screen.getByText(/fazer upload/i);
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(mockOnUploadComplete).not.toHaveBeenCalled();
    });
  });

  it('should handle drag and drop events', () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
      />
    );

    const dropzone = screen.getByText(/arraste uma imagem/i).closest('div');

    // Test drag over
    fireEvent.dragOver(dropzone!);
    expect(dropzone).toHaveClass('border-primary');

    // Test drag leave
    fireEvent.dragLeave(dropzone!);
    expect(dropzone).not.toHaveClass('border-primary');
  });

  it('should allow canceling selected file', async () => {
    render(
      <ImageUpload
        onUploadComplete={mockOnUploadComplete}
        userId={mockUserId}
      />
    );

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,mock',
    };

    global.FileReader = jest.fn(() => mockFileReader) as any;

    const input = screen.getByLabelText(/arraste uma imagem/i);
    fireEvent.change(input, { target: { files: [file] } });

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mock' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText(/cancelar/i);
    fireEvent.click(cancelButton);

    expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument();
    expect(screen.getByText(/arraste uma imagem/i)).toBeInTheDocument();
  });
});
