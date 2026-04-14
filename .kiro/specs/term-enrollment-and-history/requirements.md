# Requirements Document

## Introduction

This feature enables term-to-term enrollment within the same academic year, with automatic fee carry-forward on the new term's invoice. It also provides teachers, DOS, Headteacher, and Admin with access to historical academic data (results and report cards) across past terms and years. The system already has the core enrollment and fee carry-forward infrastructure; this feature surfaces it through the teacher portal and enforces the correct access controls for historical data.

## Glossary

- **System**: The school management platform.
- **Teacher**: A staff member assigned to teach one or more stream subjects.
- **DOS**: Director of Studies — a staff member with the DOS role, responsible for academic oversight.
- **Headteacher**: The head of the school, with full academic data access.
- **Admin**: School administrator with full system access.
- **AcademicYear**: A school year (e.g. "2025"), containing one or more AcademicTerms.
- **AcademicTerm**: A term within an academic year (e.g. Term 1, Term 2, Term 3).
- **Enrollment**: A record linking a Student to a Stream for a specific AcademicTerm.
- **NextTerm**: The AcademicTerm with the next sequential termNumber within the same AcademicYear.
- **PreviousTermBalance**: The outstanding balance (positive = arrears, negative = credit) on a student's fee account from the immediately preceding term.
- **CarryForward**: The PreviousTermBalance added to the new term's invoice total.
- **Invoice**: A fee invoice generated for a student upon enrollment into a term.
- **ReportCard**: A generated academic report for a student covering one AcademicTerm's results.
- **SubjectResult**: The computed result for a student in a subject for a given term.
- **StreamSubject**: A subject taught in a specific stream during a specific term.
- **HistoricalData**: Results, SubjectResults, and ReportCards from any past AcademicTerm.

---

## Requirements

### Requirement 1: Next-Term Enrollment by Teacher

**User Story:** As a teacher, I want to enroll my students into the next term within the same academic year, so that students can continue their studies without requiring admin intervention for each term transition.

#### Acceptance Criteria

1. WHEN a teacher navigates to their dashboard, THE System SHALL display a "Enroll to Next Term" action for each stream subject the teacher is assigned to, provided a NextTerm exists within the same AcademicYear.
2. WHEN a teacher initiates next-term enrollment for a stream, THE System SHALL only present students who are currently enrolled in that stream for the active term and are not already enrolled in the NextTerm.
3. WHEN a teacher submits next-term enrollment for selected students, THE System SHALL create Enrollment records for each selected student in the NextTerm, within the same stream and class year.
4. WHEN a teacher attempts to enroll students into a term that belongs to a different AcademicYear than the current term, THE System SHALL reject the request and return an error indicating cross-year enrollment is not permitted via this action.
5. IF a student is already enrolled in the NextTerm, THEN THE System SHALL exclude that student from the enrollment list and SHALL NOT create a duplicate Enrollment record.
6. WHEN next-term enrollment is submitted, THE System SHALL auto-enroll each student into all COMPULSORY StreamSubjects for the NextTerm in that stream, provided those StreamSubjects exist.
7. IF no StreamSubjects exist for the NextTerm in the target stream, THEN THE System SHALL still create the Enrollment record and SHALL notify the teacher that subject enrollments could not be auto-created.

---

### Requirement 2: Fee Carry-Forward on Next-Term Invoice

**User Story:** As a school administrator, I want the new term's invoice to automatically include any outstanding balance from the previous term, so that student fee arrears are tracked continuously without manual adjustment.

#### Acceptance Criteria

1. WHEN a student is enrolled into a new term and AutoInvoiceConfig has `generateOnEnrollment = true` and `includeCarryForward = true`, THE System SHALL generate an Invoice that includes the PreviousTermBalance as a CarryForward line item.
2. WHEN the PreviousTermBalance is positive (arrears), THE System SHALL add the PreviousTermBalance to the new Invoice's total balance.
3. WHEN the PreviousTermBalance is negative (credit/overpayment), THE System SHALL subtract the absolute value from the new Invoice's total balance.
4. WHEN the PreviousTermBalance is zero, THE System SHALL generate the Invoice with no CarryForward line item.
5. THE System SHALL record a CARRY_FORWARD FeeTransaction on the new term's StudentFeeAccount whenever a non-zero CarryForward is applied.
6. IF no AutoInvoiceConfig exists for the new term, THEN THE System SHALL skip invoice generation and SHALL log the skip reason without failing the enrollment.
7. IF a fee structure has not been published for the student's class and term, THEN THE System SHALL skip invoice generation, SHALL return a descriptive error to the caller, and SHALL NOT block the Enrollment record creation.
8. THE System SHALL be idempotent: if an auto-invoice has already been generated for a student and term, THE System SHALL NOT generate a second invoice on repeated enrollment calls.

---

### Requirement 3: Historical Results Access for Teachers

**User Story:** As a teacher, I want to view results and report cards from previous terms for the subjects and streams I teach, so that I can track student progress over time.

#### Acceptance Criteria

1. WHEN a teacher navigates to their portal, THE System SHALL provide access to historical SubjectResults and ReportCards for streams and subjects the teacher is currently assigned to.
2. WHEN a teacher selects a past AcademicTerm, THE System SHALL display SubjectResults for students who were enrolled in that term for the teacher's assigned subjects.
3. WHEN a teacher selects a past AcademicTerm, THE System SHALL display ReportCards for students in the teacher's assigned streams for that term, provided the ReportCards have been published.
4. THE System SHALL restrict teacher access to only the streams and subjects the teacher is assigned to — teachers SHALL NOT access results or report cards for streams or subjects outside their assignments.
5. WHILE a teacher is viewing historical data, THE System SHALL clearly indicate the AcademicYear and AcademicTerm the data belongs to.
6. IF no results or report cards exist for a selected past term, THE System SHALL display an appropriate empty state message rather than an error.

---

### Requirement 4: Historical Results Access for DOS

**User Story:** As a DOS, I want to view all past results and report cards across all streams and terms, so that I can monitor academic performance trends across the school.

#### Acceptance Criteria

1. WHEN a DOS navigates to their portal, THE System SHALL provide access to SubjectResults and ReportCards for all streams across all AcademicTerms and AcademicYears within the school.
2. WHEN a DOS selects an AcademicYear and AcademicTerm, THE System SHALL display all SubjectResults and ReportCards for that period, regardless of which teacher taught the subject.
3. THE System SHALL allow a DOS to filter historical data by AcademicYear, AcademicTerm, class, and stream.
4. IF a user has the DOS role but is not assigned to the school, THEN THE System SHALL deny access and redirect to an unauthorized page.

---

### Requirement 5: Historical Results Access for Headteacher and Admin

**User Story:** As a Headteacher or Admin, I want to view all past results and report cards across all terms and years, so that I have full visibility into the school's academic history.

#### Acceptance Criteria

1. WHEN a Headteacher or Admin navigates to the academics section, THE System SHALL provide access to SubjectResults and ReportCards for all streams, all AcademicTerms, and all AcademicYears within the school.
2. THE System SHALL allow a Headteacher or Admin to filter historical data by AcademicYear, AcademicTerm, class, and stream.
3. WHEN a Headteacher or Admin views a ReportCard, THE System SHALL display the full report card including all subject results, grades, and teacher remarks.
4. THE System SHALL enforce role-based access: only users with Admin, Headteacher, or DOS roles SHALL access the full cross-term historical data view.

---

### Requirement 6: Historical Data Integrity

**User Story:** As a school administrator, I want results and report cards from previous terms to remain intact and unmodified, so that the academic record is reliable and auditable.

#### Acceptance Criteria

1. THE System SHALL preserve all Enrollment, SubjectResult, and ReportCard records when a new AcademicTerm begins.
2. WHEN a student is enrolled into a NextTerm, THE System SHALL NOT modify or delete any Enrollment, SubjectResult, ExamMark, or ReportCard records from previous terms.
3. WHEN a ReportCard has been published, THE System SHALL prevent modification of the underlying SubjectResult and ExamMark records linked to that ReportCard.
4. THE System SHALL make historical ReportCards accessible via a stable URL that does not change when new terms are created.
5. IF a student's enrollment status in a past term is changed to INACTIVE or WITHDRAWN, THE System SHALL retain all associated SubjectResult and ReportCard records for that enrollment.
