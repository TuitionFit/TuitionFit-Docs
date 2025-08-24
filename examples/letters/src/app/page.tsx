'use client'

import { useState } from "react";
import { schools } from '../data/schools';
import { TuitionFitLetterRequest } from '../types';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const response = await submitLetter(submissionData);

      console.log(response);
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
      <form
        className="bg-white p-8 rounded shadow-md flex flex-col gap-4 w-full max-w-lg text-gray-900"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold mb-4">TuitionFit Letter Request</h2>
        
        {/* Submission Status Message */}
        {submissionStatus.type && (
          <div className={`p-3 rounded mb-4 ${
            submissionStatus.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className={`rounded px-4 py-2 transition text-white ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Letter Request'}
        </button>
      </form>
    </div>
  );
}
