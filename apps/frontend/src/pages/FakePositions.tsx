import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFakePositions } from '../hooks/useFakePositions';
import { FakePositionsFilters, AttendanceRecord } from '../types/fakePositions';

// Components
import TopBarFilters from '../components/fakePositions/TopBarFilters';
import YourLessonsSection from '../components/fakePositions/YourLessonsSection';
import AttendanceTable from '../components/fakePositions/AttendanceTable';
import DisputeModal from '../components/fakePositions/DisputeModal';
import QRScannerModal from '../components/fakePositions/QRScannerModal';
import AnalyticsPanel from '../components/fakePositions/AnalyticsPanel';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';

const FakePositions: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FakePositionsFilters>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    status: 'all'
  });

  const { 
    data, 
    analytics, 
    teacherOptions, 
    subjectOptions, 
    loading, 
    error, 
    refetch 
  } = useFakePositions(filters);

  // Modal states
  const [disputeRecord, setDisputeRecord] = useState<AttendanceRecord | null>(null);
  const [scanRecord, setScanRecord] = useState<AttendanceRecord | null>(null);

  // Check user access
  if (!user || !['ADMIN', 'HR', 'TEACHER'].includes(user.role)) {
    return (
      <div className="p-6">
        <Alert variant="error">
          У вас нет доступа к этой странице. Обратитесь к администратору.
        </Alert>
      </div>
    );
  }

  const handleDisputeClick = (record: AttendanceRecord) => {
    setDisputeRecord(record);
  };

  const handleCheckInClick = (record: AttendanceRecord) => {
    setScanRecord(record);
  };

  const handleDisputeSuccess = () => {
    refetch();
  };

  const handleScanSuccess = () => {
    refetch();
  };

  const isTeacher = user.role === 'TEACHER';
  const canViewAnalytics = ['ADMIN', 'HR'].includes(user.role);

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 lg:p-4 xl:p-6 space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="error" className="mb-4 sm:mb-6">
          {error}
        </Alert>
      )}

      {/* Teacher View */}
      {isTeacher && (
        <YourLessonsSection
          data={data}
          onDisputeClick={handleDisputeClick}
          onCheckInClick={handleCheckInClick}
        />
      )}

      {/* Admin/HR View */}
      {!isTeacher && (
        <>
          <TopBarFilters
            filters={filters}
            onFiltersChange={setFilters}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            totalRecords={data.length}
          />

          <AttendanceTable
            data={data}
            onDisputeClick={handleDisputeClick}
            loading={loading}
          />

          {canViewAnalytics && (
            <AnalyticsPanel analytics={analytics} />
          )}
        </>
      )}

      {/* Modals */}
      <DisputeModal
        record={disputeRecord}
        onClose={() => setDisputeRecord(null)}
        onSuccess={handleDisputeSuccess}
      />

      <QRScannerModal
        record={scanRecord}
        onClose={() => setScanRecord(null)}
        onSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default FakePositions;
