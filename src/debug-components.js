// Debug component to test data loading
import React, { useState, useEffect } from 'react';
import { SupabaseService } from './services/supabaseService';

const DebugStages = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Debug: Starting to load stages and classes...');
        const response = await SupabaseService.getStagesAndClasses();
        console.log('Debug: Response received:', response);

        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        console.error('Debug: Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', margin: '20px' }}>
      <h2>Debug: Stages and Classes</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DebugStages;