import { useState, useEffect } from "preact/hooks";
import ApplicationService from "../services/applicationService";
import { Application } from "../utils/applicationUtils";

interface CreateApplicationData {
  name: string;
  description: string;
}

interface UpdateApplicationData {
  name?: string;
  description?: string;
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApplicationService.fetchAllApplications();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return {
    applications,
    setApplications,
    loading,
    error,
    refetch: fetchApplications
  };
};

export const useCreateApplication = () => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createApplication = async (applicationData: CreateApplicationData) => {
    try {
      setIsCreating(true);
      setError(null);
      const newApp = await ApplicationService.createApplication(applicationData);
      console.log('Application created:', newApp);
      return newApp;
    } catch (err) {
      console.error('Error creating application:', err);
      setError('Failed to create application');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createApplication,
    isCreating,
    error
  };
};

export const useUpdateApplication = () => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateApplication = async (id: string, updateData: UpdateApplicationData) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedApp = await ApplicationService.updateApplication(id, updateData);
      console.log('Application updated:', updatedApp);
      return updatedApp;
    } catch (err) {
      console.error('Error updating application:', err);
      setError('Failed to update application');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateApplication,
    isUpdating,
    error
  };
};

export const useDeleteApplication = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteApplication = async (id: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await ApplicationService.deleteApplication(id);
      console.log('Application deleted:', id);
      return true;
    } catch (err) {
      console.error('Error deleting application:', err);
      setError('Failed to delete application');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteApplication,
    isDeleting,
    error
  };
};