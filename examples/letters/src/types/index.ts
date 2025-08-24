export type TuitionFitSchool = {
  ipedsId: string;
  federalSchoolCode: string;
  name: string;
  alias: string;
  city: string;
  state: string;
  mainCampus: string;
  tags: string;
};

export type TuitionFitLetterRequest = {
  school?: {
    ipedsId?: string;
  };
  student: {
    email?: string;
    address: {
      city?: string;
      state: string; // exactly 2 characters
      zip?: string;
    };
    profile: {
      efc: number; // integer, 0-999999
      act?: number; // integer, 1-36
      sat?: number; // integer, 400-1600
      gpa: {
        highSchool: number; // 0.0-4.0
        college?: number; // 0.0-4.0
      };
    };
  };
  letter: {
    date?: Date;
    imageBase64: string; // data URI format
  };
};

export type TuitionFitLetterResponse = {
  id: string;
  status: string; // PENDING or COMPLETE
  school: {
    ipedsId: string;
    state: string;
    name: string;
  };
  analysis: string; // TBD
  pricing: {
    upper: number;
    lower: number;
  };
};