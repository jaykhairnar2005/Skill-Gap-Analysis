import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  LinearProgress,
} from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';
import apiClient from '../services/apiClient';
import { normalizeApiError } from '../utils/apiError';
import { useFeedback } from '../context/FeedbackContext';

export default function ResumeUpload({ onUpload }) {
  const { showSuccess } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileName(file.name);

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Please upload a PDF under 5MB.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiClient.post(
        '/resumes/upload',
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              setProgress(Math.round((event.loaded * 100) / event.total));
            }
          },
        }
      );

      setSuccess('Resume uploaded successfully');
      showSuccess('Resume uploaded successfully.');
      onUpload(res.data);
    } catch (err) {
      const apiError = normalizeApiError(err, 'Upload failed');
      setError(apiError.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFileName('');
    setProgress(0);
    setSuccess('');
    setError('');
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Upload Your Resume
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload your latest PDF resume to extract skills and continue analysis.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Accepted format: PDF only. Maximum file size: 5MB.
        </Typography>

        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept=".pdf"
            id="resume"
            hidden
            onChange={handleFileChange}
          />
          <label htmlFor="resume">
            <CloudUpload sx={{ fontSize: 34, color: 'primary.main', mb: 1 }} />
            <Typography sx={{ fontWeight: 500 }}>Click to upload or replace PDF</Typography>
            <Typography variant="caption" color="text.secondary">Max file size: 5MB</Typography>
          </label>

          {selectedFileName && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected file: {selectedFileName}
            </Typography>
          )}

          {loading && (
            <Box sx={{ mt: 2 }}>
              <CircularProgress size={22} sx={{ mb: 1 }} />
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" color="text.secondary">
                Upload progress: {progress}%
              </Typography>
            </Box>
          )}
        </Box>

        {selectedFileName && !loading && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button component="label" htmlFor="resume" variant="outlined" size="small">
              Replace file
            </Button>
            <Button onClick={clearSelectedFile} variant="text" size="small">
              Remove file
            </Button>
          </Box>
        )}

        {success && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
