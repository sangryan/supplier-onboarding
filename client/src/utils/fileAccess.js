import api, { API_BASE_URL } from './api';

export const isFallbackDocument = (document) => {
  const id = document?._id;
  return typeof id === 'string' && (
    id.startsWith('doc-') ||
    id.startsWith('practicing-') ||
    id.startsWith('resume-')
  );
};

export const buildUploadUrl = (filePath, supplierId) => {
  if (!filePath) return null;

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    try {
      const parsed = new URL(filePath);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${API_BASE_URL}${parsed.pathname}`;
      }
    } catch {
      return filePath;
    }
    return filePath;
  }

  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const uploadsIndex = normalizedPath.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return encodeURI(`${API_BASE_URL}${normalizedPath.slice(uploadsIndex)}`);
  }

  if (normalizedPath.startsWith('uploads/')) {
    return encodeURI(`${API_BASE_URL}/${normalizedPath}`);
  }

  if (supplierId) {
    return encodeURI(`${API_BASE_URL}/uploads/${supplierId}/${normalizedPath}`);
  }

  return encodeURI(`${API_BASE_URL}/uploads/${normalizedPath}`);
};

export const fetchDocumentBlobUrl = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/download`, {
    responseType: 'blob'
  });

  return window.URL.createObjectURL(new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  }));
};

export const fetchFileBlobUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load file (${response.status})`);
  }

  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
};

export const downloadDocument = async (document) => {
  const blobUrl = await fetchDocumentBlobUrl(document._id);
  const link = window.document.createElement('a');
  link.href = blobUrl;
  link.download = document.originalName || document.fileName || 'document';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};
