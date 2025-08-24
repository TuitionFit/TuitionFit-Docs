'use client'

import { useState, useEffect } from "react";
import { Turnstile } from '@marsidev/react-turnstile';
import { schools } from '../data/schools';
import { TuitionFitLetterRequest, TuitionFitLetterResponse } from '../types';
import { submitLetter, getLetterStatus } from '../lib/tuitionfitLetterAPI';

export default function Home() {
  const [formData, setFormData] = useState<TuitionFitLetterRequest>({
    school: { ipedsId: "" },
    student: {
      email: "",
      address: {
        city: "",
        state: "",
        zip: ""
      },
      profile: {
        efc: 0,
        act: undefined,
        sat: undefined,
        gpa: {
          highSchool: 0,
          college: undefined
        }
      }
    },
    letter: {
      date: new Date(),
      imageBase64: ""
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLetterId, setSubmittedLetterId] = useState<string | null>(null);
  const [letterStatus, setLetterStatus] = useState<TuitionFitLetterResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Poll for letter status when we have a submitted letter ID
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (submittedLetterId && isPolling) {
      intervalId = setInterval(async () => {
        try {
          const status = await getLetterStatus(submittedLetterId, turnstileToken);
          setLetterStatus(status);
          
          // Stop polling when status is COMPLETE
          if (status.status === 'COMPLETE') {
            setIsPolling(false);
          }
        } catch (error) {
          console.error('Failed to fetch letter status:', error);
        }
      }, 1000); // Poll every 1 second
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [submittedLetterId, isPolling, turnstileToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if Turnstile token is available
    if (!turnstileToken) {
      setSubmissionStatus({
        type: 'error',
        message: 'Please complete the security verification'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus({ type: null, message: '' });

    const submissionData: TuitionFitLetterRequest = {
      ...formData,
      letter: {
        ...formData.letter,
        date: undefined,
        imageBase64: formData.letter?.imageBase64 || ""
      }
    };

    try {
      const response = await submitLetter(submissionData, turnstileToken);

      console.log(response);
      setSubmittedLetterId(response);
      setIsPolling(true);
      setSubmissionStatus({
        type: 'success',
        message: `Letter submitted successfully! ID: ${response}`
      });
      console.log("Letter submitted successfully:", response);
    } catch (error) {
      setSubmissionStatus({
        type: 'error',
        message: `Failed to submit letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      console.error("Failed to submit letter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (path: string, value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newData as Record<string, unknown>;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]] as Record<string, unknown>;
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {submittedLetterId ? (
        // Status Card - shown after successful submission
        <div className="bg-white p-8 rounded shadow-md w-full max-w-lg text-gray-900">
          <h2 className="text-xl font-bold mb-4">Letter Submission Status</h2>
          
          <div className="mb-4">
            <p className="text-green-700 bg-green-100 p-3 rounded border border-green-300">
              Letter submitted successfully! ID: {submittedLetterId}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Current Status:</h3>
            {letterStatus ? (
              <div>
                <div className={`p-2 rounded mb-2 ${
                  letterStatus.status === 'COMPLETE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Status: {letterStatus.status}
                </div>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(letterStatus, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded">
                Loading status...
              </div>
            )}
          </div>

          {letterStatus?.status === 'COMPLETE' && (
            <button
              onClick={() => {
                setSubmittedLetterId(null);
                setLetterStatus(null);
                setIsPolling(false);
                setTurnstileToken(null);
                setSubmissionStatus({ type: null, message: '' });
              }}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
            >
              Submit Another Letter
            </button>
          )}
        </div>
      ) : (
        // Form - shown initially and after reset
        <form
          className="bg-white p-8 rounded shadow-md flex flex-col gap-4 w-full max-w-lg text-gray-900"
          onSubmit={handleSubmit}
        >
          <h2 className="text-xl font-bold mb-4">TuitionFit Letter Request</h2>
          
          {/* Submission Status Message */}
          {submissionStatus.type && submissionStatus.type === 'error' && (
            <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4">
              {submissionStatus.message}
            </div>
          )}
        
        {/* School Selection */}
        <label className="flex flex-col gap-1">
          School:
          <select
            value={formData.school?.ipedsId || ""}
            onChange={e => updateFormData("school.ipedsId", e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Select a school</option>
            {schools.map(school => 
              <option key={school.ipedsId} value={school.ipedsId}>{school.name}</option>
            )}
          </select>
        </label>

        {/* Student Email */}
        <label className="flex flex-col gap-1">
          Email:
          <input
            type="email"
            value={formData.student?.email || ""}
            onChange={e => updateFormData("student.email", e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>

        {/* Student Address */}
        <label className="flex flex-col gap-1">
          City:
          <input
            type="text"
            value={formData.student?.address?.city || ""}
            onChange={e => updateFormData("student.address.city", e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1">
          State: *
          <input
            type="text"
            value={formData.student?.address?.state || ""}
            onChange={e => updateFormData("student.address.state", e.target.value.toUpperCase())}
            className={`border rounded px-2 py-1 ${errors.state ? 'border-red-500' : ''}`}
            maxLength={2}
          />
          {errors.state && <span className="text-red-500 text-sm">{errors.state}</span>}
        </label>

        <label className="flex flex-col gap-1">
          ZIP Code:
          <input
            type="text"
            value={formData.student?.address?.zip || ""}
            onChange={e => updateFormData("student.address.zip", e.target.value)}
            className="border rounded px-2 py-1"
          />
        </label>

        {/* Student Profile */}
        <label className="flex flex-col gap-1">
          EFC (Expected Family Contribution): *
          <input
            type="number"
            value={formData.student?.profile?.efc || 0}
            onChange={e => updateFormData("student.profile.efc", parseInt(e.target.value) || 0)}
            className={`border rounded px-2 py-1 ${errors.efc ? 'border-red-500' : ''}`}
            min={0}
            max={999999}
          />
          {errors.efc && <span className="text-red-500 text-sm">{errors.efc}</span>}
        </label>

        <label className="flex flex-col gap-1">
          ACT Score:
          <input
            type="number"
            value={formData.student?.profile?.act || ""}
            onChange={e => updateFormData("student.profile.act", e.target.value ? parseInt(e.target.value) : undefined)}
            className={`border rounded px-2 py-1 ${errors.act ? 'border-red-500' : ''}`}
            min={1}
            max={36}
          />
          {errors.act && <span className="text-red-500 text-sm">{errors.act}</span>}
        </label>

        <label className="flex flex-col gap-1">
          SAT Score:
          <input
            type="number"
            value={formData.student?.profile?.sat || ""}
            onChange={e => updateFormData("student.profile.sat", e.target.value ? parseInt(e.target.value) : undefined)}
            className={`border rounded px-2 py-1 ${errors.sat ? 'border-red-500' : ''}`}
            min={400}
            max={1600}
          />
          {errors.sat && <span className="text-red-500 text-sm">{errors.sat}</span>}
        </label>

        <label className="flex flex-col gap-1">
          High School GPA: *
          <input
            type="number"
            step="0.01"
            value={formData.student?.profile?.gpa?.highSchool || 0}
            onChange={e => updateFormData("student.profile.gpa.highSchool", parseFloat(e.target.value) || 0)}
            className={`border rounded px-2 py-1 ${errors.highSchoolGpa ? 'border-red-500' : ''}`}
            min={0}
            max={4}
          />
          {errors.highSchoolGpa && <span className="text-red-500 text-sm">{errors.highSchoolGpa}</span>}
        </label>

        <label className="flex flex-col gap-1">
          College GPA:
          <input
            type="number"
            step="0.01"
            value={formData.student?.profile?.gpa?.college || ""}
            onChange={e => updateFormData("student.profile.gpa.college", e.target.value ? parseFloat(e.target.value) : undefined)}
            className={`border rounded px-2 py-1 ${errors.collegeGpa ? 'border-red-500' : ''}`}
            min={0}
            max={4}
          />
          {errors.collegeGpa && <span className="text-red-500 text-sm">{errors.collegeGpa}</span>}
        </label>

        {/* Letter */}
        <label className="flex flex-col gap-1">
          Letter Date:
          <input
            type="date"
            value={formData.letter?.date ? new Date(formData.letter.date).toISOString().split('T')[0] : ""}
            onChange={e => updateFormData("letter.date", e.target.value ? new Date(e.target.value) : new Date())}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1">
          Letter Image (Base64): *
          <textarea
            value={formData.letter?.imageBase64 || ""}
            onChange={e => updateFormData("letter.imageBase64", e.target.value)}
            className={`border rounded px-2 py-1 h-24 ${errors.imageBase64 ? 'border-red-500' : ''}`}
            placeholder="Paste base64 image data here..."
          />
          {errors.imageBase64 && <span className="text-red-500 text-sm">{errors.imageBase64}</span>}
        </label>

        {/* Cloudflare Turnstile */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Security Verification:</label>
          <Turnstile
            siteKey={"0x4AAAAAABukb7ZJheNLI8vf"} // this will probably change
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !turnstileToken}
          className={`rounded px-4 py-2 transition text-white ${
            isSubmitting || !turnstileToken
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Letter Request'}
        </button>
      </form>
      )}
    </div>
  );
}
