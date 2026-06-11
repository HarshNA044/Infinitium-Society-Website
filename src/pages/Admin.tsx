import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Plus, Scan, Users, Calendar, 
  Trash2, CheckCircle, XCircle, ChevronLeft,
  LayoutDashboard, ListOrdered, Camera, Linkedin, Edit3,
  Trophy, Download, LogIn, Github, Menu, X, MessageSquare,
  Globe, Award, Target, Handshake, Lightbulb, Clock, Mail, ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useApi } from '../hooks/useApi';
import { Logo } from '../App';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, 
  query, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User
} from 'firebase/auth';
import { cn, compressImage } from '../lib/utils';

export default function Admin_Page() {
  const { request, loading: apiLoading } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [fetchedStats, setFetchedStats] = useState<Record<string, { registrations: number; attendance: number; societyAttendance?: number }>>({});
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState<string>('');
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, totalAttendance: 0, eventsCount: 0 });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberImagePreview, setMemberImagePreview] = useState<string | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState<string | null>(null);
  const [eventMediaPreviews, setEventMediaPreviews] = useState<string[]>([]);
  const [isEventImageProcessing, setIsEventImageProcessing] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'member' | 'event' | 'gallery' | 'achievement' } | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Scanner state
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedScanEventId, setSelectedScanEventId] = useState<string>('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const ScannerTimeout = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // New states for expanded control
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<any>(null);

  const [gallery, setGallery] = useState<any[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isSubmittingGallery, setIsSubmittingGallery] = useState(false);

  // About management state
  const [aboutData, setAboutData] = useState<any>(null);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  // Certificate generation states
  const [selectedCertEvent, setSelectedCertEvent] = useState<any>(null);
  const [pdfTemplateBytes, setPdfTemplateBytes] = useState<Uint8Array | null>(null);
  const [pdfTemplateName, setPdfTemplateName] = useState<string>('');
  const [selectedPlaceholders, setSelectedPlaceholders] = useState({ name: true, course: true, college: true, year: true });
  const [textPositions, setTextPositions] = useState({
    name: { y: 300, fontSize: 28 },
    course: { y: 250, fontSize: 14 },
    college: { y: 210, fontSize: 12 },
    year: { y: 175, fontSize: 12 }
  });
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [registrantsForCert, setRegistrantsForCert] = useState<any[]>([]);
  const [generatingPreviews, setGeneratingPreviews] = useState(false);
  const [previewBlobUrls, setPreviewBlobUrls] = useState<string[]>([]);
  const [sendingCertificates, setSendingCertificates] = useState(false);
  const [certSendingProgress, setCertSendingProgress] = useState({ total: 0, sent: 0, currentStudentName: '' });
  const [certError, setCertError] = useState<string | null>(null);
  const [certSuccessMessage, setCertSuccessMessage] = useState<string | null>(null);

  const uint8ToBase64 = (uint8: Uint8Array): string => {
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return window.btoa(binary);
  };

  const drawCenteredText = (page: any, text: string, y: number, maxSize: number, font: any, color: any, padding = 80) => {
    const pageWidth = page.getWidth();
    let size = maxSize;
    let textWidth = font.widthOfTextAtSize(text, size);
    const maxAllowedWidth = pageWidth - padding;
    
    // Dynamically scale down font size if it exceeds the boundary
    while (textWidth > maxAllowedWidth && size > 8) {
      size -= 1;
      textWidth = font.widthOfTextAtSize(text, size);
    }
    
    const x = (pageWidth - textWidth) / 2;
    page.drawText(text, { x, y: y + (maxSize - size) / 3, size, font, color });
  };

  const generateSingleCertificate = async (
    student: any,
    templateBytes: Uint8Array | null,
    enabledFields: { name: boolean; course: boolean; college: boolean; year: boolean },
    positions: { name: { y: number; fontSize: number }; course: { y: number; fontSize: number }; college: { y: number; fontSize: number }; year: { y: number; fontSize: number } },
    eventTitle: string,
    eventDate: string,
    eventLocation?: string
  ): Promise<Uint8Array> => {
    let pdfDoc;
    let filledFormFields = false;

    if (templateBytes) {
      pdfDoc = await PDFDocument.load(templateBytes);
      
      // Attempt to fill dynamic form fields matching user custom handles (e.g. {{student name}}, {{course}}, etc.)
      try {
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        if (fields && fields.length > 0) {
          fields.forEach(field => {
            const fieldName = field.getName();
            const lowerName = fieldName.toLowerCase().trim();
            
            if (typeof (field as any).setText === 'function') {
              const textField = field as any;
              
              // Normalize field name by stripping curly braces, spaces, hyphens, and underscores
              const cleanName = lowerName.replace(/[\{\}\s_\-\[\]]/g, '');
              
              if (
                cleanName === 'studentname' || 
                cleanName === 'student' ||
                cleanName === 'name' || 
                cleanName === 'fullname' ||
                lowerName.includes('student name') || 
                lowerName.includes('{{student name}}') ||
                lowerName.includes('name')
              ) {
                textField.setText(student.studentName?.toUpperCase() || '');
                filledFormFields = true;
              } else if (
                cleanName === 'course' || 
                cleanName === 'branch' ||
                cleanName === 'subject' ||
                lowerName.includes('course') ||
                lowerName.includes('{{course}}')
              ) {
                textField.setText(student.course || '');
                filledFormFields = true;
              } else if (
                cleanName === 'college' || 
                cleanName === 'collegename' || 
                cleanName === 'institution' || 
                cleanName === 'university' ||
                lowerName.includes('college') ||
                lowerName.includes('{{college}}') ||
                lowerName.includes('college name') || 
                lowerName.includes('{{college name}}')
              ) {
                textField.setText(student.collegeName || '');
                filledFormFields = true;
              } else if (
                cleanName === 'year' || 
                cleanName === 'semester' || 
                cleanName === 'academicyear' ||
                cleanName === 'yearstudent' ||
                lowerName.includes('year') ||
                lowerName.includes('{{year}}')
              ) {
                const yearStr = student.year ? (student.year.toString().toLowerCase().includes('year') ? student.year : `${student.year} Year`) : '';
                textField.setText(yearStr);
                filledFormFields = true;
              } else if (
                cleanName === 'event' || 
                cleanName === 'eventname' || 
                cleanName === 'eventtitle' || 
                cleanName === 'topic' ||
                lowerName.includes('event') ||
                lowerName.includes('{{event name}}') ||
                lowerName.includes('{{event}}')
              ) {
                textField.setText(eventTitle || '');
                filledFormFields = true;
              } else if (
                cleanName === 'date' || 
                cleanName === 'eventdate' || 
                cleanName === 'datetime' ||
                lowerName.includes('date') ||
                lowerName.includes('{{event date}}') ||
                lowerName.includes('{{date}}')
              ) {
                textField.setText(eventDate || '');
                filledFormFields = true;
              }
            }
          });
          
          if (filledFormFields) {
            // Flatten the PDF form fields into standard non-editable output vector lines
            form.flatten();
          }
        }
      } catch (err) {
        console.warn("Unable to process interactive PDF Form Fields (PDF might have no form elements). Falling back to direct layout positioning: ", err);
      }
    } else {
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([842, 595]); // landscape A4
      const { width, height } = page.getSize();
      
      // Draw professional double borders
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(15/255, 12/255, 41/255), // #0f0c29 Deep Navy/Purple
        borderWidth: 4,
        color: rgb(254/255, 254/255, 254/255),
      });
      
      page.drawRectangle({
        x: 28,
        y: 28,
        width: width - 56,
        height: height - 56,
        borderColor: rgb(20/255, 184/255, 166/255), // Teal inner border
        borderWidth: 2,
      });

      // Draw elegant corner accents
      const corners = [
        { x: 32, y: 32 },
        { x: width - 42, y: 32 },
        { x: 32, y: height - 42 },
        { x: width - 42, y: height - 42 }
      ];
      corners.forEach(c => {
        page.drawRectangle({
          x: c.x,
          y: c.y,
          width: 10,
          height: 10,
          color: rgb(20/255, 184/255, 166/255), // Teal
        });
      });

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // --- Draw Dynamic Custom Database-backed Logo or elegant Scientific Orbit fallback ---
      const logoX = 421;
      const logoY = 495;
      let logoImageLoaded = false;

      try {
        // ALWAYS try loading the official /logo.png first (rasterized logo.svg)
        const logoRes = await fetch('/logo.png');
        if (logoRes.ok) {
          const logoBytes = await logoRes.arrayBuffer();
          const embeddedLogo = await pdfDoc.embedPng(logoBytes);
          if (embeddedLogo) {
            const scaled = embeddedLogo.scale(0.35);
            page.drawImage(embeddedLogo, {
              x: logoX - scaled.width / 2,
              y: logoY - scaled.height / 2,
              width: scaled.width,
              height: scaled.height,
            });
            logoImageLoaded = true;
          }
        }
      } catch (logoErr) {
        console.warn("Failed to load official /logo.png asset, falling back to database logo: ", logoErr);
      }

      if (!logoImageLoaded && aboutData?.logo) {
        try {
          const rawBase64 = aboutData.logo.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
          const binaryStr = window.atob(rawBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          
          let embeddedLogo;
          if (aboutData.logo.includes('image/png')) {
            embeddedLogo = await pdfDoc.embedPng(bytes);
          } else {
            embeddedLogo = await pdfDoc.embedJpg(bytes);
          }

          if (embeddedLogo) {
            const scaled = embeddedLogo.scale(0.35);
            page.drawImage(embeddedLogo, {
              x: logoX - scaled.width / 2,
              y: logoY - scaled.height / 2,
              width: scaled.width,
              height: scaled.height,
            });
            logoImageLoaded = true;
          }
        } catch (logoErr) {
          console.warn("Failed to embed website's custom team logo into PDF:", logoErr);
        }
      }

      if (!logoImageLoaded) {
        // Fallback to elegant scientific orbit logo
        // Outer orbit circle (thin line)
        page.drawCircle({
          x: logoX,
          y: logoY,
          size: 24,
          borderColor: rgb(15/255, 12/255, 41/255),
          borderWidth: 1.5,
        });

        // Secondary nested orbit path
        page.drawCircle({
          x: logoX,
          y: logoY,
          size: 16,
          borderColor: rgb(20/255, 184/255, 166/255),
          borderWidth: 1,
        });

        // Core nucleus (glowing teal spot)
        page.drawCircle({
          x: logoX,
          y: logoY,
          size: 8,
          color: rgb(20/255, 184/255, 166/255),
        });

        // Electron dots
        page.drawCircle({
          x: logoX - 18,
          y: logoY - 10,
          size: 3.5,
          color: rgb(15/255, 12/255, 41/255),
        });
        page.drawCircle({
          x: logoX + 16,
          y: logoY + 12,
          size: 3.5,
          color: rgb(20/255, 184/255, 166/255),
        });
        page.drawCircle({
          x: logoX - 4,
          y: logoY + 20,
          size: 3,
          color: rgb(15/255, 12/255, 41/255),
        });
      }

      // Header texts
      drawCenteredText(page, "INFINITIUM SOCIETY", 440, 22, fontBold, rgb(15/255, 12/255, 41/255));
      drawCenteredText(page, "ATMA RAM SANATAN DHARMA COLLEGE | UNIVERSITY OF DELHI", 418, 9.5, fontRegular, rgb(100/255, 116/255, 139/255));

      // Draw elegant signatures at bottom
      page.drawLine({
        start: { x: 120, y: 85 },
        end: { x: 280, y: 85 },
        color: rgb(100/255, 116/255, 139/255),
        thickness: 1,
      });
      page.drawText("Faculty Advisor", { x: 160, y: 67, size: 9, font: fontRegular, color: rgb(100/255, 116/255, 139/255) });

      page.drawLine({
        start: { x: 562, y: 85 },
        end: { x: 722, y: 85 },
        color: rgb(100/255, 116/255, 139/255),
        thickness: 1,
      });
      page.drawText("President, Infinitium", { x: 595, y: 67, size: 9, font: fontRegular, color: rgb(100/255, 116/255, 139/255) });
    }

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Only draw coordinates on top of the document if we didn't fill dedicated form placeholders
    if (!filledFormFields) {
      if (!templateBytes) {
        // 1. "This is to certify that"
        drawCenteredText(firstPage, "This is to certify that", 373, 11.5, fontRegular, rgb(51/255, 65/255, 85/255));

        // 2. Student Name (dynamic)
        if (enabledFields.name && student.studentName) {
          drawCenteredText(firstPage, student.studentName.toUpperCase(), positions.name.y, positions.name.fontSize, fontBold, rgb(15/255, 12/255, 41/255));
        }

        // 3. COURSE TITLE Label
        drawCenteredText(firstPage, "COURSE TITLE", positions.course.y + 17, 8, fontRegular, rgb(148/255, 163/255, 184/255));

        // 4. Course Title (dynamic)
        if (enabledFields.course && student.course) {
          drawCenteredText(firstPage, student.course.toString().toUpperCase(), positions.course.y, positions.course.fontSize, fontBold, rgb(51/255, 65/255, 85/255));
        }

        // 5. YEAR OF STUDY Label
        drawCenteredText(firstPage, "YEAR OF STUDY", positions.year.y + 17, 8, fontRegular, rgb(148/255, 163/255, 184/255));

        // 6. Year of Study (dynamic)
        if (enabledFields.year && student.year) {
          const rawYearStr = student.year.toString().toUpperCase();
          const yearStr = rawYearStr.includes('YEAR') ? rawYearStr : `${rawYearStr} YEAR`;
          drawCenteredText(firstPage, yearStr, positions.year.y, positions.year.fontSize, fontRegular, rgb(100/255, 116/255, 139/255));
        }

        // 7. EVENT NAME Label
        drawCenteredText(firstPage, "EVENT NAME", positions.college.y + 17, 8, fontRegular, rgb(148/255, 163/255, 184/255));

        // 8. Event Name (dynamic at positions.college.y)
        if (enabledFields.college) {
          drawCenteredText(firstPage, eventTitle.toUpperCase(), positions.college.y, positions.college.fontSize || 14, fontBold, rgb(20/255, 184/255, 166/255));
        }

        // 9. Centered descriptive paragraph at the bottom
        const venueName = eventLocation || 'ATMA RAM SANATAN DHARMA COLLEGE, NEW DELHI';
        const summaryText = `has actively participated and demonstrated outstanding achievement in "${eventTitle}" held on ${eventDate} at ${venueName}.`;
        drawCenteredText(firstPage, summaryText, 110, 9.5, fontRegular, rgb(100/255, 116/255, 139/255));
      } else {
        // If there's a custom template, draw the selected coordinates directly on it
        if (enabledFields.name && student.studentName) {
          drawCenteredText(firstPage, student.studentName.toUpperCase(), positions.name.y, positions.name.fontSize, fontBold, rgb(15/255, 12/255, 41/255));
        }

        if (enabledFields.course && student.course) {
          drawCenteredText(firstPage, student.course, positions.course.y, positions.course.fontSize, fontRegular, rgb(51/255, 65/255, 85/255));
        }

        if (enabledFields.college && student.collegeName) {
          drawCenteredText(firstPage, student.collegeName, positions.college.y, positions.college.fontSize, fontRegular, rgb(100/255, 116/255, 139/255));
        }

        if (enabledFields.year && student.year) {
          const yearStr = student.year.toString().toLowerCase().includes('year') ? student.year : `${student.year} Year`;
          drawCenteredText(firstPage, yearStr, positions.year.y, positions.year.fontSize, fontRegular, rgb(100/255, 116/255, 139/255));
        }
      }
    }

    return await pdfDoc.save();
  };

  const loadRegistralsForCert = async (event: any) => {
    if (!event || !event.sheetId) {
      setCertError("This event does not have an associated Google Sheet ID configured.");
      return;
    }
    setLoadingRegistrants(true);
    setCertError(null);
    setRegistrantsForCert([]);
    
    const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      setCertError("Apps Script URL is not configured. Please define VITE_APPS_SCRIPT_URL.");
      setLoadingRegistrants(false);
      return;
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          type: "get_registrations",
          sheetId: event.sheetId
        })
      });
      
      const res = await response.json();
      if (res.status === "success" && Array.isArray(res.registrations)) {
        // Map attendance status to 'attended' boolean
        const formattedRegistrations = res.registrations.map((reg: any) => {
          let hasAttended = false;
          if (reg.attended === true || String(reg.attended).toLowerCase() === 'true') {
            hasAttended = true;
          } else {
            const keys = Object.keys(reg);
            for (const k of keys) {
              const kLower = k.toLowerCase().trim();
              if (kLower === 'attendance' || kLower === 'attended' || kLower === 'present' || kLower === 'status' || kLower.includes('attendance') || kLower.includes('attended')) {
                const val = String(reg[k]).toLowerCase().trim();
                if (val === 'yes' || val === 'present' || val === 'checked' || val === 'checked-in' || val === 'attended' || val === 'true') {
                  hasAttended = true;
                  break;
                }
              }
            }
          }
          return { ...reg, attended: hasAttended };
        });
        setRegistrantsForCert(formattedRegistrations);
      } else {
        setCertError("Could not retrieve registrations. Make sure sheetId is correct and Webhook is active.");
      }
    } catch (err: any) {
      console.error("Error loading registrations for certificate:", err);
      setCertError(err.message || "Failed to query attendee registration data.");
    } finally {
      setLoadingRegistrants(false);
    }
  };

  const generatePreviews = async () => {
    if (!selectedCertEvent) return;
    setGeneratingPreviews(true);
    
    // Revoke previous URLs to prevent memory leaks
    previewBlobUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewBlobUrls([]);

    const attendedList = registrantsForCert.filter(r => r.attended);
    
    // If we have none retrieved yet, create 1 mock student to show instant preview
    const studentsToPreview = attendedList.length > 0 
      ? attendedList.slice(0, 1) 
      : [
          { studentName: "John Doe", course: "B.Sc. (Hons) Computer Science", collegeName: "ARSD College", year: "III" }
        ];

    try {
      const urls: string[] = [];
      for (const s of studentsToPreview) {
        const bytes = await generateSingleCertificate(
          s,
          pdfTemplateBytes,
          selectedPlaceholders,
          textPositions,
          selectedCertEvent.title,
          selectedCertEvent.date,
          selectedCertEvent.location
        );
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        urls.push(url);
      }
      setPreviewBlobUrls(urls);
    } catch (err: any) {
      console.error("Failed to generate previews:", err);
    } finally {
      setGeneratingPreviews(false);
    }
  };

  const handleSendCertificates = async () => {
    if (!selectedCertEvent) return;
    const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      setCertError("Apps Script URL is not configured (VITE_APPS_SCRIPT_URL is missing).");
      return;
    }

    const attendedList = registrantsForCert.filter(r => r.attended);
    if (attendedList.length === 0) {
      setCertError("There are no registered students marked as present (attended) for this event.");
      return;
    }

    setSendingCertificates(true);
    setCertError(null);
    setCertSuccessMessage(null);
    setCertSendingProgress({ total: attendedList.length, sent: 0, currentStudentName: '' });

    try {
      let sentCount = 0;
      for (let i = 0; i < attendedList.length; i++) {
        const student = attendedList[i];
        setCertSendingProgress({ total: attendedList.length, sent: i, currentStudentName: student.studentName });

        // 1. Generate individual personalized certificate
        const certBytes = await generateSingleCertificate(
          student,
          pdfTemplateBytes,
          selectedPlaceholders,
          textPositions,
          selectedCertEvent.title,
          selectedCertEvent.date,
          selectedCertEvent.location
        );

        // 2. Convert to Base64
        const pdfBase64 = uint8ToBase64(certBytes);

        const emailRecipient = student.email || student.Email || student['Email ID'] || student['email'] || student['EmailId'];
        console.log("DEBUG: student object for certificate:", student);
        console.log("DEBUG: email recipient:", emailRecipient);

        if (!emailRecipient || typeof emailRecipient !== 'string' || !emailRecipient.includes('@')) {
          console.error("Skipping: Invalid or missing email for student", student.studentName);
          continue; 
        }

        // 3. Dispatch individually using 'send_certificate' to Apps Script
        const emailSubject = `🎓 Certificate of Participation: "${selectedCertEvent.title}"`;
        const emailBody = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <div style="background-color: #0f0c29; border-top: 4px solid #14b8a6; padding: 25px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 2px;">INFINITIUM</h1>
    <p style="color: #14b8a6; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">Atma Ram Sanatan Dharma College</p>
  </div>
  <div style="padding: 30px; line-height: 1.6; color: #334155; background-color: #ffffff;">
    <h2 style="color: #0f0c29; margin-top: 0; font-size: 18px;">Your certificate is here!</h2>
    <p>Dear <strong>${student.studentName}</strong>,</p>
    <p>Congratulations! Your Certificate of Participation for the event <strong>${selectedCertEvent.title}</strong> has been issued.</p>
    <p>Please find your digital certificate attached to this email as a PDF document.</p>
    <p>Thank you for participating actively in INFINITIUM events. We look forward to hosting you for more scientific workshops and other events in the future!</p>
    <p style="margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
      Warm regards,<br/>
      <strong>Infinitium Society</strong><br/>
      Atma Ram Sanatan Dharma College, University of Delhi
    </p>
  </div>
  <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
    This is an automated system email. Please do not reply directly to this message.
  </div>
</div>
        `;
        
        const payload = {
            type: "send_certificate",
            sheetId: selectedCertEvent.sheetId,
            email: emailRecipient,
            subject: emailSubject,
            message: emailBody,
            fileName: `Certificate_${student.studentName.replace(/\s+/g, '_')}.pdf`,
            pdfBase64: pdfBase64
        };
        console.log("DEBUG: Sending payload to Apps Script:", payload);

        const response = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(payload)
        });

        const resText = await response.text();
        if (!response.ok) {
          throw new Error(`Failed to send email for ${student.studentName}: ${resText}`);
        }

        if (resText.includes("Error") || !resText.includes("Success")) {
          throw new Error(`Apps Script reported error for ${student.studentName}: ${resText}`);
        }

        sentCount++;
      }

      setCertSendingProgress({ total: attendedList.length, sent: sentCount, currentStudentName: '' });
      setCertSuccessMessage(`Successfully processed and dispatched all ${sentCount} certificates via email!`);
    } catch (err: any) {
      console.error("Error dispatching certificates:", err);
      setCertError(err.message || "An error occurred while generating or dispatching certificates.");
    } finally {
      setSendingCertificates(false);
    }
  };

  useEffect(() => {
    if (selectedCertEvent) {
      loadRegistralsForCert(selectedCertEvent);
    } else {
      // Clear up preview URLs to avoid memory leaks
      previewBlobUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewBlobUrls([]);
      setPdfTemplateBytes(null);
      setPdfTemplateName('');
      setRegistrantsForCert([]);
      setCertError(null);
      setCertSuccessMessage(null);
    }
  }, [selectedCertEvent]);

  useEffect(() => {
    if (selectedCertEvent) {
      generatePreviews().catch(err => console.error("Error generating previews:", err));
    }
  }, [selectedCertEvent, pdfTemplateBytes, selectedPlaceholders, textPositions, registrantsForCert]);

  // Contact management state
  const [contactConfig, setContactConfig] = useState<{ sheetId: string; adminEmail: string }>({ sheetId: '', adminEmail: '' });
  const [isSavingContactConfig, setIsSavingContactConfig] = useState(false);

  const handleSaveContactConfig = async (sheetId: string, adminEmail: string) => {
    setIsSavingContactConfig(true);
    try {
      await setDoc(doc(db, 'settings', 'contact_config'), {
        sheetId: sheetId.trim(),
        adminEmail: adminEmail.trim()
      }, { merge: true });
      setContactConfig({ sheetId: sheetId.trim(), adminEmail: adminEmail.trim() });
      alert("Contact settings (spreadsheets & admin email) saved successfully!");
    } catch (e) {
      console.error("Failed to save contact config:", e);
      alert("Failed to save configuration: " + (e instanceof Error ? e.message : String(e)));
      handleFirestoreError(e, OperationType.WRITE, 'settings/contact_config');
    } finally {
      setIsSavingContactConfig(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser && currentUser.email === 'teaminfinitium.arsd@gmail.com') {
        loadFirebaseData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Manage dynamic statistics loader and temporary JSON cache in Firestore
  useEffect(() => {
    let active = true;
    
    const fetchAllEventStats = async () => {
      if ((activeTab !== 'overview' && activeTab !== 'events') || events.length === 0) return;
      
      setIsFetchingStats(true);
      const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
      if (!appsScriptUrl) {
        console.warn("Apps Script URL is not configured. Please define VITE_APPS_SCRIPT_URL.");
        setIsFetchingStats(false);
        return;
      }

      const tempStatsMap: Record<string, { registrations: number; attendance: number; societyAttendance: number }> = {};

      // Initialize with existing values
      events.forEach((e: any) => {
        tempStatsMap[e.id] = {
          registrations: e.stats?.registrations || 0,
          attendance: e.stats?.attendance || 0,
          societyAttendance: e.stats?.societyAttendance || 0
        };
      });

      try {
        await Promise.all(
          events.map(async (e: any) => {
            if (!e.sheetId) return;

            try {
              const response = await fetch(appsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                  type: 'get_registrations',
                  sheetId: e.sheetId
                })
              });

              const resultObj = await response.json();
              if (resultObj.status === "success" && Array.isArray(resultObj.registrations)) {
                const list = resultObj.registrations;
                const totalReg = list.length;
                
                // Count present students strictly by counting 'yes' in 'attendance/attended/present' fields
                let totalAtt = 0;
                let totalSocietyAtt = 0;
                list.forEach((reg: any) => {
                  let hasAttended = false;

                  // 1. Check direct 'attended' boolean mapping from row[11] === "Yes" in Apps Script
                  if (reg.attended === true || String(reg.attended).toLowerCase() === 'true') {
                    hasAttended = true;
                  } else {
                    // 2. Fallback check: look for any keys related to attendance, and verify value equals 'yes'
                    const keys = Object.keys(reg);
                    for (const k of keys) {
                      const kLower = k.toLowerCase().trim();
                      if (kLower === 'attendance' || kLower === 'attended' || kLower === 'present' || kLower === 'status' || kLower.includes('attendance') || kLower.includes('attended')) {
                        const val = String(reg[k]).toLowerCase().trim();
                        if (val === 'yes' || val === 'present' || val === 'checked' || val === 'checked-in' || val === 'attended' || val === 'true') {
                          hasAttended = true;
                          break;
                        }
                      }
                    }
                  }

                  if (hasAttended) {
                    totalAtt += 1;

                    // Check "part of society" field of Excel file
                    let isPart = false;
                    const rKeys = Object.keys(reg);
                    for (const rk of rKeys) {
                      const rkLower = rk.toLowerCase().trim().replace(/[\s_-]/g, '');
                      if (rkLower === 'ispartofsociety' || rkLower === 'partofsociety' || rkLower === 'society' || rkLower.includes('partof') || rkLower.includes('society')) {
                        const val = String(reg[rk]).toLowerCase().trim();
                        if (val === 'yes' || val === 'true' || val === '1') {
                          isPart = true;
                          break;
                        }
                      }
                    }
                    if (isPart) {
                      totalSocietyAtt += 1;
                    }
                  }
                });

                tempStatsMap[e.id] = {
                  registrations: totalReg,
                  attendance: totalAtt,
                  societyAttendance: totalSocietyAtt
                };
              }
            } catch (err) {
              console.error(`Error loading registration list for event ${e.title || e.id}:`, err);
            }
          })
        );

        if (!active) return;

        // Cache in local storage for instant rendering
        localStorage.setItem('temp_events_stats_json', JSON.stringify(tempStatsMap));
        setFetchedStats(tempStatsMap);

        // Upload JSON file with full stats to Firestore temp_jsons to satisfy criteria
        const docId = `temp_events_stats_${user?.uid || 'default'}`;
        await setDoc(doc(db, 'temp_jsons', docId), {
          content: JSON.stringify(tempStatsMap),
          createdAt: serverTimestamp()
        });
        console.log("Cached event stats JSON inside Firebase Firestore successfully.");

      } catch (err) {
        console.error("Failed to fetch or cache event stats:", err);
      } finally {
        if (active) {
          setIsFetchingStats(false);
        }
      }
    };

    fetchAllEventStats();

    return () => {
      active = false;
    };
  }, [activeTab, events, user?.uid]);

  // Clean up and delete Firestore stats JSON to minimize Database storage on tab-switch or component unmount
  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'events' && user?.uid) {
      const docId = `temp_events_stats_${user.uid}`;
      deleteDoc(doc(db, 'temp_jsons', docId))
        .then(() => console.log("Removed stats JSON from Firestore on tab switch"))
        .catch(err => console.error("Error deleting stats JSON from Firestore:", err));
      
      localStorage.removeItem('temp_events_stats_json');
      setFetchedStats({});
    }

    return () => {
      // Upon unmounting (switching page completely), delete the temp JSON
      if (user?.uid) {
        const docId = `temp_events_stats_${user.uid}`;
        deleteDoc(doc(db, 'temp_jsons', docId))
          .then(() => console.log("Removed stats JSON from Firestore on component unmount"))
          .catch(err => console.error("Error deleting stats JSON from Firestore on unmount:", err));
      }
      localStorage.removeItem('temp_events_stats_json');
    };
  }, [activeTab, user?.uid]);

  // Handle unload, tab closes or pagehide cleanup to satisfy storage minimization of firebase
  useEffect(() => {
    const cleanUpTempJson = () => {
      localStorage.removeItem('temp_events_stats_json');
      if (user?.uid) {
        const docId = `temp_events_stats_${user.uid}`;
        // Fire of standard delete doc
        deleteDoc(doc(db, 'temp_jsons', docId)).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', cleanUpTempJson);
    window.addEventListener('unload', cleanUpTempJson);
    window.addEventListener('pagehide', cleanUpTempJson);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanUpTempJson();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', cleanUpTempJson);
      window.removeEventListener('unload', cleanUpTempJson);
      window.removeEventListener('pagehide', cleanUpTempJson);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoginError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google login failed", error);
      setLoginError("Social login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEvents([]);
      setMembers([]);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const loadFirebaseData = async () => {
    try {
      // Load Members
      try {
        const membersSnap = await getDocs(query(collection(db, 'members'), orderBy('tenure', 'desc')));
        setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'members');
      }

      // Load Achievements
      try {
        const achievementsSnap = await getDocs(query(collection(db, 'achievements'), orderBy('createdAt', 'desc')));
        setAchievements(achievementsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'achievements');
      }

      // Load Gallery
      try {
        const gallerySnap = await getDocs(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')));
        setGallery(gallerySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'gallery');
      }

      // Load About
      try {
        const aboutDoc = await getDoc(doc(db, 'about', 'current'));
        if (aboutDoc.exists()) {
          setAboutData(aboutDoc.data());
        } else {
          // Initialize with default structure
            setAboutData({
              hero: { 
                title: "INFINITIUM SOCIETY", 
                paragraph: "The Premier Society of Physical Sciences at ARSD College, University of Delhi.", 
                image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop" 
              },
            objectives: [
              { id: 'obj1', title: 'Scientific Temper', text: 'Cultivating a curious and analytical mindset.' },
              { id: 'obj2', title: 'Innovation', text: 'Providing a platform for creative solutions.' },
              { id: 'obj3', title: 'Leadership', text: 'Developing organizational skills.' },
              { id: 'obj4', title: 'Teamwork', text: 'Fostering a collaborative environment where students work together across disciplines to achieve common scientific goals.' },
              { id: 'obj5', title: 'Equal opportunity to all', text: 'Ensuring 100% inclusivity and a meritocratic platform where every student has fair access to resources and mentorship.' },
              { id: 'obj6', title: 'Networking', text: 'Building professional bridges by connecting students with faculty, alumni, and global scientific communities.' },
              { id: 'obj7', title: 'Value', text: 'Instilling core scientific ethics and integrity, creating long-term academic and professional value for our members.' }
            ],
            impacts: [
              { id: 'imp1', title: '1000 +', text: 'Students reached annually' },
              { id: 'imp2', title: '10 +', text: 'Events organised annually' }
            ],
            departments: [
              { id: 'dep1', title: 'Core Team', aim: 'Overall management', tasks: ['Operations', 'Strategy'] },
              { id: 'dep2', title: 'Technical', aim: 'Research and Dev', tasks: ['Workshops', 'Coding'] },
              { id: 'dep3', title: 'Content', aim: 'Knowledge Sharing', tasks: ['Blogs', 'Magazines'] }
            ]
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'about');
      }

      // Load Events
      try {
        const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('date', 'desc')));
        const eventsList = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setEvents(eventsList);

        // Compute stats
        let totalReg = 0;
        let totalAtt = 0;
        eventsList.forEach((e: any) => {
          totalReg += (e.stats?.registrations || 0);
          totalAtt += (e.stats?.attendance || 0);
        });

        setStats({
          totalRegistrations: totalReg,
          totalAttendance: totalAtt,
          eventsCount: eventsList.length
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'events');
      }

      // Load Contact Config
      try {
        const contactConfigDoc = await getDoc(doc(db, 'settings', 'contact_config'));
        if (contactConfigDoc.exists()) {
          const cfg = contactConfigDoc.data() || {};
          setContactConfig({
            sheetId: cfg.sheetId || '',
            adminEmail: cfg.adminEmail || ''
          });
        }
      } catch (e) {
        console.warn("Could not load contact config:", e);
      }
    } catch (error: any) {
      console.error("Error loading Firebase data", error);
    }
  };

  const handleMemberFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 400, 0.6); // Members need small avatar style images
        setMemberImagePreview(compressed);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image.");
      }
    }
  };

  const handleEventFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1000, 600, 0.7); // Events need wider banners
        setEventImagePreview(compressed);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image.");
      }
    }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageProcessing(true);
      try {
        const compressed = await compressImage(file, 1024, 1024, 0.7); // 1024 is safer for document limits
        setGalleryImagePreview(compressed);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image. It might be too large or an unsupported format.");
      } finally {
        setIsImageProcessing(false);
      }
    }
  };

  const handleEventMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsEventImageProcessing(true);
      try {
        const fileArray = Array.from(files) as File[];
        const compressedPromises = fileArray.map(file => compressImage(file, 1024, 1024, 0.7));
        const compressed = await Promise.all(compressedPromises);
        setEventMediaPreviews(prev => [...prev, ...compressed]);
      } catch (err) {
        console.error("Media compression failed", err);
        alert("Failed to process one or more images.");
      } finally {
        setIsEventImageProcessing(false);
      }
    }
  };

  const removeEventMedia = (index: number) => {
    setEventMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSavingLogo(true);
      try {
        const compressed = await compressImage(file, 256, 256, 0.8);
        const updatedAbout = {
          ...aboutData,
          logo: compressed
        };
        setAboutData(updatedAbout);
        await setDoc(doc(db, 'about', 'current'), updatedAbout);
        alert("Website custom logo set and saved to the database successfully! The header navbar logo, bottom footer logo, and browser favicon will now be updated in real-time.");
      } catch (err) {
        console.error("Logo upload/save failed", err);
        alert("Failed to process and save logo image: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsSavingLogo(false);
      }
    }
  };

  const handleAboutHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1000, 600, 0.7);
        setAboutData((prev: any) => ({
          ...prev,
          hero: {
            ...prev.hero,
            image: compressed
          }
        }));
      } catch (err) {
        console.error("Hero image compression failed", err);
        alert("Failed to process hero image.");
      }
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberImagePreview) {
      alert("Please upload a profile photo.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const startYear = formData.get('startYear');
    const endYear = formData.get('endYear');
    const tenure = `${startYear}-${endYear?.toString().slice(-2)}`;

    const data = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      image: memberImagePreview,
      linkedin: formData.get('linkedin') as string || '',
      course: formData.get('course') as string || '',
      year: formData.get('year') as string || '',
      tenure: tenure,
    };

    const path = 'members';
    try {
      if (editingMember) {
        const docRef = doc(db, path, editingMember.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowMemberModal(false);
      setEditingMember(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingMember ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteMember = async (id: string) => {
    const path = `members/${id}`;
    try {
      await deleteDoc(doc(db, 'members', id));
      loadFirebaseData();
      setDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setEditingMember(null);
    setMemberImagePreview(null);
  };

  const handleEventSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventImagePreview) {
      alert("Please upload a poster image.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const sheetId = formData.get('sheetId') as string;
    const data: any = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      type: formData.get('type') as string,
      date: formData.get('date') as string,
      location: formData.get('location') as string,
      image: eventImagePreview,
      description: formData.get('description') as string,
      startTime: formData.get('startTime') as string || '',
      whatsappGroup: formData.get('whatsappGroup') as string || '',
      status: editingEvent?.status || 'Upcoming',
      isInterCollege: !!formData.get('isInterCollege'),
      stats: {
        registrations: editingEvent?.stats?.registrations || 0,
        attendance: editingEvent?.stats?.attendance || 0
      }
    };

    if (sheetId !== null) {
      data.sheetId = sheetId;
    }

    const path = 'events';
    setIsEventSubmitting(true);
    try {
      let eventId = editingEvent?.id;
      if (editingEvent) {
        const docRef = doc(db, path, editingEvent.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
        eventId = docRef.id;
      }

      // Handle additional media
      if (eventMediaPreviews.length > 0 && eventId) {
        for (const src of eventMediaPreviews) {
          // Add to subcollection
          const photoRef = doc(collection(db, 'events', eventId, 'photos'));
          await setDoc(photoRef, {
            src,
            createdAt: serverTimestamp()
          });

          // Add to gallery
          const galleryRef = doc(collection(db, 'gallery'));
          await setDoc(galleryRef, {
            src,
            title: data.title,
            description: `A moment from ${data.title} on ${data.date}`,
            category: 'Events',
            eventId: eventId,
            eventDate: data.date,
            createdAt: serverTimestamp()
          });
        }
      }

      setShowAddEvent(false);
      setEditingEvent(null);
      setEventImagePreview(null);
      setEventMediaPreviews([]);
      loadFirebaseData();
    } catch (error) {
      const errorPath = editingEvent ? `${path}/${editingEvent.id}` : path;
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.CREATE, errorPath);
    } finally {
      setIsEventSubmitting(false);
    }
  };

  const closeEventModal = () => {
    setShowAddEvent(false);
    setEditingEvent(null);
    setEventImagePreview(null);
    setEventMediaPreviews([]);
  };

  const handleAchievementSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string
    };

    const path = 'achievements';
    try {
      if (editingAchievement) {
        const docRef = doc(db, path, editingAchievement.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowAchievementModal(false);
      setEditingAchievement(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingAchievement ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleGallerySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isImageProcessing) {
      alert("Please wait for image to finish processing.");
      return;
    }
    
    setIsSubmittingGallery(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      src: galleryImagePreview || formData.get('src') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      eventDate: formData.get('eventDate') as string || ''
    };

    const path = 'gallery';
    try {
      if (editingGallery) {
        const docRef = doc(db, path, editingGallery.id);
        await updateDoc(docRef, data);
      } else {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, { ...data, createdAt: serverTimestamp() });
      }
      setShowGalleryModal(false);
      setEditingGallery(null);
      setGalleryImagePreview(null);
      loadFirebaseData();
    } catch (error) {
      handleFirestoreError(error, editingGallery ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSubmittingGallery(false);
    }
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setEditingGallery(null);
    setGalleryImagePreview(null);
  };

  // Effect to manage scanner initialization
  useEffect(() => {
    if (isScanning && activeTab === 'scanner' && selectedScanEventId) {
      isProcessingRef.current = false;
      ScannerTimeout.current = setTimeout(() => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        scannerRef.current = new Html5QrcodeScanner(
          "reader", 
          { 
            fps: 25, 
            qrbox: { width: 250, height: 250 },
            facingMode: isMobile ? { exact: "environment" } : "user",
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          } as any, 
          false
        );
        
        scannerRef.current.render(async (decodedText) => {
          if (isProcessingRef.current) {
            console.log("Scan already in progress. Ignoring duplicate frame.");
            return;
          }
          isProcessingRef.current = true;

          try {
            setScanResult({ loading: true });
            
            let cleanTicketId = decodedText.trim();
            // Fallback: If scanner decoded a full URL
            if (cleanTicketId.includes("http")) {
              try {
                const url = new URL(cleanTicketId);
                const ticketParam = url.searchParams.get("ticket") || url.searchParams.get("ticketId") || url.searchParams.get("id");
                if (ticketParam) {
                  cleanTicketId = ticketParam.trim();
                } else {
                  const segments = url.pathname.split('/');
                  const lastSegment = segments[segments.length - 1];
                  if (lastSegment && lastSegment.toUpperCase().startsWith("INF-")) {
                    cleanTicketId = lastSegment.trim();
                  }
                }
              } catch (urlErr) {
                console.error("Failed to parse scanned text as URL:", urlErr);
              }
            }

            // 1. Fetch, verify and mark attendance directly via Apps Script (Extremely fast, sub-second single request!)
            const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
            if (!appsScriptUrl) {
              throw new Error("Apps Script URL is not configured (VITE_APPS_SCRIPT_URL).");
            }

            const targetEvent = events.find((e: any) => e.id === selectedScanEventId);
            if (!targetEvent || !targetEvent.sheetId) {
              throw new Error("Selected event does not have an associated Google Sheet ID.");
            }

            const response = await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ 
                type: 'attendance',
                ticketId: cleanTicketId,
                sheetId: targetEvent.sheetId
              })
            });

            const resultText = await response.text();
            console.log("Apps Script attendance check response:", resultText);

            let resObj: any = null;
            try {
              resObj = JSON.parse(resultText);
            } catch (err) {
              // Fallback for older Apps Script returning raw text
              if (resultText === "Attendance Marked") {
                resObj = { status: "success", alreadyMarked: false, student: { studentName: "Attendee" } };
              } else if (resultText.toLowerCase().includes("not found") || resultText.toLowerCase().includes("error")) {
                resObj = { status: "error", message: resultText };
              } else {
                resObj = { status: "success", alreadyMarked: true, student: { studentName: "Attendee" } };
              }
            }

            if (!resObj || resObj.status === "error") {
              throw new Error(resObj?.message || "Invalid ticket or wrong event.");
            }

            const regData = resObj.student || { studentName: "Attendee" };

            // 2. Cache the scanning check-in concisely in Firebase temp_jsons to satisfy the blueprint/schema requirement cleanly
            const tempId = `temp_scan_cache_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const tempDocRef = doc(db, 'temp_jsons', tempId);
            try {
              console.log(`Writing scanning check-in cache to Firebase: temp_jsons/${tempId}`);
              await setDoc(tempDocRef, {
                content: JSON.stringify({
                  eventId: selectedScanEventId,
                  ticketId: cleanTicketId,
                  studentName: regData.studentName || "Attendee",
                  rollNo: regData.rollNo || "",
                  status: "completed",
                  timestamp: new Date().toISOString()
                }),
                createdAt: serverTimestamp()
              });
              
              // Verify cache exists (complying with storage-efficient cache requirement)
              const cacheSnap = await getDoc(tempDocRef);
              if (cacheSnap.exists()) {
                console.log("Check-in cache verified successfully.");
              }
            } catch (cacheErr) {
              console.error("Error managing check-in cache in Firebase:", cacheErr);
            } finally {
              // ALWAYS delete the temporary JSON document from Firestore immediately once duplicate check is complete
              deleteDoc(tempDocRef).catch(delErr => console.error("Error deleting temp scan cache:", delErr));
            }

            // 3. Increment attendance stats on the local Event Firestore document if not already marked
            if (!resObj.alreadyMarked) {
              const eventRef = doc(db, 'events', selectedScanEventId);
              const eventSnap = await getDoc(eventRef);
              if (eventSnap.exists()) {
                const currentAttendance = eventSnap.data().stats?.attendance || 0;
                await updateDoc(eventRef, {
                  'stats.attendance': currentAttendance + 1
                });
              }
            }

            setScanResult({ 
              success: true, 
              student: regData,
              alreadyMarked: !!resObj.alreadyMarked,
              ticketId: decodedText
            });
            
            loadFirebaseData();
          } catch (err: any) {
            console.error("Scan error:", err);
            setScanResult({ success: false, error: err.message });
          } finally {
            // Keep scanner open for the next scan.
            // Reset the processing state after a brief 1.5-second cooldown to avoid rapid double-scanning of the same ticket.
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 1500);
          }
        }, (err) => {
          // ignore errors
        });
      }, 500); // Increased timeout to ensure DOM update
    }

    return () => {
      stopScanner();
      if (ScannerTimeout.current) clearTimeout(ScannerTimeout.current);
    };
  }, [isScanning, activeTab, selectedScanEventId]);

  const stopScanner = () => {
    isProcessingRef.current = false;
    if (scannerRef.current) {
        // Clear scanner only if initialized, needs to be wrapped in a try/catch if it fails
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
    }
  };

  const COLORS = ['#14b8a6', '#0d9488', '#0f766e', '#115e59']; // brand-500, 600, 700, 800

  const liveStats = React.useMemo(() => {
    let totalRegistrations = 0;
    let totalAttendance = 0;
    let totalSocietyAttendance = 0;
    let hasLive = false;

    events.forEach((e: any) => {
      let reg = e.stats?.registrations || 0;
      let att = e.stats?.attendance || 0;
      let soc = e.stats?.societyAttendance || 0;
      if (fetchedStats[e.id] !== undefined) {
        reg = fetchedStats[e.id].registrations;
        att = fetchedStats[e.id].attendance;
        soc = fetchedStats[e.id].societyAttendance || 0;
        hasLive = true;
      } else {
        try {
          const raw = localStorage.getItem('temp_events_stats_json');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed[e.id] !== undefined) {
              reg = parsed[e.id].registrations;
              att = parsed[e.id].attendance;
              soc = parsed[e.id].societyAttendance || 0;
              hasLive = true;
            }
          }
        } catch (_) {}
      }
      totalRegistrations += reg;
      totalAttendance += att;
      totalSocietyAttendance += soc;
    });

    return {
      totalRegistrations: hasLive ? totalRegistrations : stats.totalRegistrations,
      totalAttendance: hasLive ? totalAttendance : stats.totalAttendance,
      totalSocietyAttendance,
      completionRate: (hasLive ? totalRegistrations : stats.totalRegistrations) > 0 
        ? Math.round(((hasLive ? totalAttendance : stats.totalAttendance) / (hasLive ? totalRegistrations : stats.totalRegistrations)) * 100) 
        : 0
    };
  }, [events, fetchedStats, stats]);

  const chartData = events.map((e: any) => {
    let reg = e.stats?.registrations || 0;
    let att = e.stats?.attendance || 0;
    if (fetchedStats[e.id] !== undefined) {
      reg = fetchedStats[e.id].registrations;
      att = fetchedStats[e.id].attendance;
    } else {
      try {
        const raw = localStorage.getItem('temp_events_stats_json');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed[e.id] !== undefined) {
            reg = parsed[e.id].registrations;
            att = parsed[e.id].attendance;
          }
        }
      } catch (_) {}
    }
    return {
      name: e.title?.split(':')[0]?.substring(0, 15) || 'Event',
      registrations: reg,
      attendance: att,
    };
  });

  const typeData = events.reduce((acc: any, e: any) => {
    const type = e.type || 'Other';
    const eventName = e.title || 'Untitled Event';
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += 1;
      if (!existing.events.includes(eventName)) {
        existing.events.push(eventName);
      }
    } else {
      acc.push({ name: type, value: 1, events: [eventName] });
    }
    return acc;
  }, []);

  const PIE_COLORS = ['#0d9488', '#0f766e', '#115e59', '#134e4a', '#14b8a6'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.email !== 'teaminfinitium.arsd@gmail.com') {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-12 border border-slate-100 shadow-2xl shadow-brand-950/10 text-center space-y-8">
          <Logo className="w-24 h-24 mx-auto" />
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Admin Login</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2 leading-relaxed">
              This area is restricted to INFINITIUM core administrators. Please authenticate with your authorized Google account.
            </p>
          </div>
          <div className="py-8">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-5 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-brand-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl shadow-brand-950/20 group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-125 transition-transform" alt="Google" /> Sign in with Google
            </button>
          </div>
          {loginError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center animate-shake mt-4">
                {loginError}
              </p>
            )}
          {user && user.email !== 'teaminfinitium.arsd@gmail.com' && (
            <p className="text-red-600 text-xs font-bold uppercase tracking-widest">
              Access Denied for {user.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  const scannableEvents = events.filter((e: any) => 
    e.status === 'Upcoming'
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row relative">
      {/* Mobile Sidebar Header */}
      <div className="md:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between sticky top-0 z-[60]">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter text-zinc-900 leading-none">INFINITIUM</h2>
            <p className="text-[6px] text-zinc-400 font-black uppercase tracking-[0.1em] mt-1 hidden sm:block">Society of Physical Sciences, ARSD College</p>
          </div>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-zinc-50 rounded-xl border border-zinc-100"
        >
          {isSidebarOpen ? <XCircle className="w-6 h-6 text-zinc-600" /> : <Menu className="w-6 h-6 text-zinc-600" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-[70]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-zinc-100 shadow-xl shadow-zinc-200/40 p-6 flex flex-col gap-8 z-[80] transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Link to="/" className="hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Logo className="w-11 h-11 transition-transform hover:scale-105" />
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter leading-none text-zinc-900">INFINITIUM</h2>
            <p className="text-[7px] text-zinc-400 font-extrabold uppercase tracking-[0.1em] mt-1 hidden sm:block">PHYSICAL SCIENCES HUB</p>
          </div>
        </Link>

        {/* User Block with high polish */}
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mb-2 relative overflow-hidden group">
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-500/20" alt="Admin" referrerPolicy="no-referrer" />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black uppercase text-zinc-800 tracking-wider truncate mb-0.5">{user.displayName}</p>
              <div className="flex items-center gap-2">
                <span className="text-[8px] bg-brand-100 text-brand-700 font-black uppercase px-1 rounded-sm">ADMIN</span>
                <button 
                  onClick={handleLogout}
                  className="text-[9px] font-bold text-red-500 uppercase hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>

        <nav className="flex flex-col gap-1.5">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'events', icon: ListOrdered, label: 'Events' },
            { id: 'members', icon: Users, label: 'Team' },
            { id: 'achievements', icon: Trophy, label: 'Achievements' },
            { id: 'gallery', icon: Camera, label: 'Gallery' },
            { id: 'about', icon: LayoutDashboard, label: 'About Page' },
            { id: 'scanner', icon: Scan, label: 'QR Scanner' },
            { id: 'contacts', icon: Mail, label: 'Contacts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all duration-200 relative group/btn",
                activeTab === tab.id 
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/30 font-extrabold translate-x-1" 
                  : "text-zinc-500 hover:bg-brand-50 hover:text-brand-600"
              )}
            >
              <tab.icon className={cn("w-4.5 h-4.5 transition-transform group-hover/btn:scale-110", activeTab === tab.id ? "text-white" : "text-zinc-400 group-hover/btn:text-brand-500")} />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl font-bold text-zinc-900 capitalize">{activeTab === 'members' ? 'Team' : activeTab} Panel</h1>
              {(activeTab === 'overview' || activeTab === 'events') && isFetchingStats && (
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold text-cyan-600 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-full animate-pulse select-none self-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                  Syncing Live Sheets Stats...
                </div>
              )}
            </div>
            <p className="text-zinc-500 font-medium mt-1">Manage INFINITIUM's backend operations.</p>
          </div>
          <div className="flex gap-4">
            {activeTab === 'events' && (
            <button 
              onClick={() => {
                setEditingEvent(null);
                setSelectedEventDate('');
                setEventImagePreview(null);
                setShowAddEvent(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Create Event
            </button>
          )}
          {activeTab === 'members' && (
            <button 
              onClick={() => {
                setEditingMember(null);
                setMemberImagePreview(null);
                setShowMemberModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Add Team Member
            </button>
          )}
          {activeTab === 'achievements' && (
            <button 
              onClick={() => {
                setEditingAchievement(null);
                setShowAchievementModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Add Achievement
            </button>
          )}
          {activeTab === 'gallery' && (
            <button 
              onClick={() => {
                setEditingGallery(null);
                setShowGalleryModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-brand-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-950/20 border border-brand-900"
            >
              <Plus className="w-5 h-5" /> Add Image
            </button>
          )}

          {activeTab === 'about' && (
            <button 
              onClick={async () => {
                if (!aboutData) {
                  alert("No data to save. Please wait for the page to load.");
                  return;
                }
                setIsSavingAbout(true);
                try {
                  await setDoc(doc(db, 'about', 'current'), aboutData);
                  alert("About page updated successfully!");
                } catch (error) {
                  handleFirestoreError(error, OperationType.WRITE, 'about/current');
                } finally {
                  setIsSavingAbout(false);
                }
              }}
              disabled={isSavingAbout}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 border border-brand-700 disabled:opacity-50"
            >
              {isSavingAbout ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bento-card bg-white p-8 border border-zinc-100 shadow-sm relative overflow-hidden group hover:border-brand-350 transition-all duration-300">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-zinc-400 font-extrabold text-[10px] uppercase tracking-[0.2em]">Total Registrations</p>
                  <div className="p-2 bg-brand-50 rounded-xl text-brand-600 transition-colors group-hover:bg-brand-100">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black text-zinc-900 tracking-tighter mt-1">
                  {isFetchingStats ? (
                    <span className="text-2xl font-bold text-zinc-400 animate-pulse">Fetching...</span>
                  ) : (
                    liveStats.totalRegistrations
                  )}
                </p>
                <div className="mt-6 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${liveStats.totalRegistrations > 0 ? 80 : 0}%` }}></div>
                </div>
              </div>

              <div className="bento-card bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white border-none shadow-xl shadow-brand-600/10 hover:shadow-brand-600/20 transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-brand-100/90 font-extrabold text-[10px] uppercase tracking-[0.2em]">Total Attendance</p>
                  <div className="p-2 bg-white/10 rounded-xl text-white transition-transform group-hover:scale-105">
                    <Scan className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black tracking-tighter mt-1">
                  {isFetchingStats ? (
                    <span className="text-2xl font-bold text-brand-100 animate-pulse">Fetching...</span>
                  ) : (
                    liveStats.totalAttendance
                  )}
                </p>
                <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${liveStats.totalRegistrations > 0 ? (liveStats.totalAttendance / liveStats.totalRegistrations) * 100 : 0}%` }}></div>
                </div>
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/[0.03] rounded-full blur-xl pointer-events-none"></div>
              </div>

              <div className="bento-card bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white border-none shadow-xl shadow-teal-500/10 hover:shadow-teal-500/20 transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-teal-100/90 font-extrabold text-[10px] uppercase tracking-[0.2em]">Present Society Members</p>
                  <div className="p-2 bg-white/10 rounded-xl text-white transition-transform group-hover:scale-105">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black tracking-tighter mt-1">
                  {isFetchingStats ? (
                    <span className="text-2xl font-bold text-teal-100 animate-pulse">Fetching...</span>
                  ) : (
                    liveStats.totalSocietyAttendance
                  )}
                </p>
                <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${liveStats.totalAttendance > 0 ? (liveStats.totalSocietyAttendance / liveStats.totalAttendance) * 100 : 0}%` }}></div>
                </div>
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/[0.03] rounded-full blur-xl pointer-events-none"></div>
              </div>

              <div className="bento-card bg-gradient-to-br from-amber-400 to-amber-500 p-8 text-amber-950 border-none shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-amber-950/75 font-extrabold text-[10px] uppercase tracking-[0.2em]">Completion Rate</p>
                  <div className="p-2 bg-amber-950/10 rounded-xl text-amber-955">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                </div>
                <p className="text-4xl font-black tracking-tighter mt-1">
                  {isFetchingStats ? (
                    <span className="text-2xl font-bold text-amber-950/70 animate-pulse">Fetching...</span>
                  ) : (
                    `${liveStats.completionRate}%`
                  )}
                </p>
                <div className="mt-6 h-1 w-full bg-amber-950/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-950 transition-all duration-1000" style={{ width: `${liveStats.completionRate}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bento-card lg:col-span-2 h-[410px]">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Event Statistics (Reg vs Att)</h3>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Registrations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Attendance</span>
                      </div>
                   </div>
                 </div>
                 <ResponsiveContainer width="100%" height="80%">
                   <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 700}} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold'}}
                     />
                     <Bar dataKey="registrations" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={32} />
                     <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               
               <div className="bento-card min-h-[410px] flex flex-col justify-between">
                 <div>
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Event Distribution</h3>
                   <div className="h-[180px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={typeData}
                           innerRadius={50}
                           outerRadius={70}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           {typeData.map((_, index) => (
                             <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip 
                           content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload;
                               return (
                                 <div className="bg-white p-3 rounded-2xl border border-zinc-100 shadow-xl text-[11px] font-bold">
                                   <p className="text-slate-800 uppercase mb-1.5">{data.name}: {data.value}</p>
                                   <div className="flex flex-col gap-1 border-t border-slate-50 pt-1.5 max-w-[200px]">
                                     {(data.events || []).map((evt: string, i: number) => (
                                       <span key={i} className="text-[9px] text-zinc-500 font-medium capitalize truncate block" title={evt}>
                                         • {evt}
                                       </span>
                                     ))}
                                   </div>
                                 </div>
                               );
                             }
                             return null;
                           }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
                 <div className="mt-4 flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {typeData.map((item, index) => (
                      <div key={item.name} className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-100 text-left w-full">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                          <span className="text-[9px] font-black text-slate-700 uppercase">{item.name}: {item.value}</span>
                        </div>
                        <div className="pl-3 flex flex-col gap-0.5">
                          {(item.events || []).map((evt: string, i: number) => (
                            <span key={i} className="text-[8px] font-bold text-slate-400 capitalize block truncate" title={evt}>
                              • {evt}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

          </div>
        )}

        {/* Rebuilt Tabs and panels */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Events ({events.length})</h2>
                {isFetchingStats && (
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-extrabold text-cyan-600 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-full animate-pulse select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                    Syncing Live Sheets Stats...
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Event</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Date & Time</th>
                    <th className="px-8 py-5">Location</th>
                    <th className="px-8 py-5 text-center">Present / Registered</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {events.map((e: any) => (
                    <tr key={e.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {e.image && (
                            <img src={e.image} className="w-12 h-12 object-cover rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{e.title}</p>
                            <p className="text-xs text-zinc-400 font-medium">{e.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-bold uppercase tracking-wider">
                          {e.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-700">{e.date}</p>
                        <p className="text-xs text-zinc-400 font-semibold uppercase">{e.startTime || 'No specific time'}</p>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-700">
                        {e.location}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center items-center">
                          {isFetchingStats ? (
                            <span className="text-xs font-black text-cyan-500 animate-pulse uppercase tracking-wider font-mono">Fetching...</span>
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-[#041a1a] border-2 border-[#5ce1e6] flex flex-col items-center justify-center text-center shadow-md shadow-[#5ce1e6]/10 shrink-0 select-none">
                              <span className="block text-xs font-black text-[#5ce1e6] leading-none" title="Total Present">
                                {(() => {
                                  if (fetchedStats[e.id] !== undefined) {
                                    return fetchedStats[e.id].attendance;
                                  }
                                  try {
                                    const raw = localStorage.getItem('temp_events_stats_json');
                                    if (raw) {
                                      const parsed = JSON.parse(raw);
                                      if (parsed[e.id] !== undefined) return parsed[e.id].attendance;
                                    }
                                  } catch (_) {}
                                  return e.stats?.attendance || 0;
                                })()}
                              </span>
                              <div className="w-6 h-[1px] bg-[#5ce1e6]/40 my-0.5" />
                              <span className="block text-[10px] font-black text-cyan-200/70 leading-none" title="Total Registered">
                                {(() => {
                                  if (fetchedStats[e.id] !== undefined) {
                                    return fetchedStats[e.id].registrations;
                                  }
                                  try {
                                    const raw = localStorage.getItem('temp_events_stats_json');
                                    if (raw) {
                                      const parsed = JSON.parse(raw);
                                      if (parsed[e.id] !== undefined) return parsed[e.id].registrations;
                                    }
                                  } catch (_) {}
                                  return e.stats?.registrations || 0;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end items-center">
                          <button
                            onClick={() => {
                              setSelectedCertEvent(e);
                            }}
                            title="Generate & Distribute Certificates"
                            className="p-2.5 bg-cyan-50 hover:bg-cyan-100 rounded-xl text-cyan-600 hover:text-cyan-900 transition-all border border-cyan-100 flex items-center justify-center gap-1.5 font-bold text-xs px-3.5"
                          >
                            <Award className="w-4 h-4 text-cyan-500 animate-pulse" />
                            <span>Certificate</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingEvent(e);
                              setEventImagePreview(e.image);
                              setEventMediaPreviews([]);
                              setShowAddEvent(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: e.id, type: 'event' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No events found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Team Members ({members.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Profile</th>
                    <th className="px-8 py-5">Name</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5">Course & Year</th>
                    <th className="px-8 py-5">Tenure</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {members.map((m: any) => (
                    <tr key={m.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        {m.image && (
                          <img src={m.image} className="w-12 h-12 object-cover rounded-full border border-zinc-100" referrerPolicy="no-referrer" />
                        )}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900">
                        {m.name}
                      </td>
                      <td className="px-8 py-5 text-sm font-semibold text-zinc-600">
                        {m.role}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-600 select-none">
                        {m.course ? `${m.course} (${m.year})` : '—'}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold uppercase tracking-wider">
                        {m.tenure}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingMember(m);
                              setMemberImagePreview(m.image);
                              setShowMemberModal(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: m.id, type: 'member' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No team members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">All Achievements ({achievements.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Title</th>
                    <th className="px-8 py-5">Description</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {achievements.map((a: any) => (
                    <tr key={a.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900">
                        {a.title}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-medium max-w-xs truncate">
                        {a.description}
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold">
                        {a.date}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingAchievement(a);
                              setShowAchievementModal(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: a.id, type: 'achievement' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {achievements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No achievements found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/50 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-[0.2em]">Gallery Directory ({gallery.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50/30">
                    <th className="px-8 py-5">Image</th>
                    <th className="px-8 py-5">Title/Description</th>
                    <th className="px-8 py-5">Category</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {gallery.map((g: any) => (
                    <tr key={g.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        {g.src && (
                          <img src={g.src} className="w-14 h-14 object-cover rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900">{g.title}</p>
                        <p className="text-xs text-zinc-400 font-medium max-w-xs truncate">{g.description}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          {g.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold">
                        {g.eventDate || 'N/A'}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setEditingGallery(g);
                              setGalleryImagePreview(g.src);
                              setShowGalleryModal(true);
                            }}
                            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all border border-zinc-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: g.id, type: 'gallery' })}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all border border-red-100/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {gallery.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        No gallery images found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'about' && aboutData && (
          <div className="space-y-8">
            {/* Hero Banner info */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-6">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">Hero Banner info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Hero Title</label>
                  <input
                    value={aboutData.hero?.title || ''}
                    onChange={(e) => setAboutData({
                      ...aboutData,
                      hero: { ...aboutData.hero, title: e.target.value }
                    })}
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2 block">Hero Banner Image</label>
                  <div className="flex items-center gap-4 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                    <div className="relative w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                      {aboutData.hero?.image ? (
                        <img 
                          src={aboutData.hero.image} 
                          alt="Hero Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-[9px] text-zinc-400 font-bold uppercase text-center p-1">No Image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAboutHeroImageChange}
                        className="hidden"
                        id="hero-image-upload-input"
                      />
                      <label 
                        htmlFor="hero-image-upload-input"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all text-zinc-700"
                      >
                        <Camera className="w-3.5 h-3.5 text-zinc-500" /> Upload Image
                      </label>
                      <p className="text-[9.5px] text-zinc-400 font-medium mt-1 uppercase tracking-wider">JPEG or PNG, scaled to 1000x600px</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Hero Paragraph</label>
                <textarea
                  value={aboutData.hero?.paragraph || ''}
                  onChange={(e) => setAboutData({
                    ...aboutData,
                    hero: { ...aboutData.hero, paragraph: e.target.value }
                  })}
                  className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-medium h-24"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-6">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">Society Objectives</h2>
              {aboutData.objectives?.map((obj: any, idx: number) => (
                <div key={obj.id || idx} className="p-6 bg-zinc-50 rounded-2xl border-2 border-zinc-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Objective Title</label>
                    <input
                      value={obj.title || ''}
                      onChange={(e) => {
                        const flexibleObjs = [...aboutData.objectives];
                        flexibleObjs[idx] = { ...flexibleObjs[idx], title: e.target.value };
                        setAboutData({ ...aboutData, objectives: flexibleObjs });
                      }}
                      className="w-full px-5 py-4 bg-white rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Objective Text</label>
                    <textarea
                      value={obj.text || ''}
                      onChange={(e) => {
                        const flexibleObjs = [...aboutData.objectives];
                        flexibleObjs[idx] = { ...flexibleObjs[idx], text: e.target.value };
                        setAboutData({ ...aboutData, objectives: flexibleObjs });
                      }}
                      className="w-full px-5 py-4 bg-white rounded-2xl border-2 border-zinc-100 text-sm font-medium h-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">QR Ticket Scanner</h2>
              <p className="text-sm text-zinc-500 font-medium">Verify event tickets and log student attendees instantly.</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Select Active Event</label>
              <select
                value={selectedScanEventId}
                onChange={(e) => {
                  stopScanner();
                  setIsScanning(false);
                  setSelectedScanEventId(e.target.value);
                  setScanResult(null);
                }}
                className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold outline-none"
              >
                <option value="">-- Choose Event to Check attendance --</option>
                {events.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>

            {selectedScanEventId && (
              <div className="text-center space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    if (isScanning) {
                      stopScanner();
                      setIsScanning(false);
                    } else {
                      setIsScanning(true);
                      setScanResult(null);
                    }
                  }}
                  className={`px-8 py-4 ${isScanning ? 'bg-zinc-600 hover:bg-zinc-700' : 'bg-brand-600 hover:bg-brand-700'} text-white rounded-3xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl`}
                >
                  {isScanning ? 'Stop Camera' : 'Start Ticket Scanner'}
                </button>

                {isScanning && (
                  <div className="border border-zinc-100 rounded-3xl overflow-hidden shadow-2xl relative bg-zinc-50">
                    <div className="absolute top-4 left-4 z-10 bg-emerald-500/95 backdrop-blur-sm text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                      ONLINE & ACTIVE
                    </div>
                    <div id="reader" className="w-full max-w-md mx-auto aspect-square"></div>
                  </div>
                )}
              </div>
            )}

            {scanResult && (
              <div className={`p-6 rounded-3xl border-2 ${scanResult.loading ? 'bg-zinc-50 border-zinc-100 text-zinc-600' : scanResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-red-50 border-red-100 text-red-900'} transition-all text-center space-y-3`}>
                {scanResult.loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin"></div>
                    <span className="font-bold uppercase tracking-widest text-xs">Processing check-in...</span>
                  </div>
                ) : scanResult.success ? (
                  <>
                    <h3 className="text-lg font-black uppercase text-emerald-800">Success! Checked-In</h3>
                    <p className="text-sm font-bold">{scanResult.student?.studentName || 'Attendee'} ({scanResult.student?.rollNo || 'N/A'})</p>
                    <p className="text-xs font-semibold uppercase">{scanResult.alreadyMarked ? '⚠️ Attendance already logged earlier' : '✓ Attendance marked successfully'}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-black uppercase text-red-800">Check-in Failed</h3>
                    <p className="text-sm font-bold">{scanResult.error}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-xl shadow-slate-100/50 space-y-8 max-w-2xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-2">Google Sheets Configuration</h2>
              <p className="text-sm text-zinc-500 font-medium">Configure where the inquiries, registrations and feedback data are stored in Google Sheets.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveContactConfig(
                formData.get('sheetId') as string,
                formData.get('adminEmail') as string
              );
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Master Spreadsheet Google Sheet ID</label>
                <input
                  name="sheetId"
                  defaultValue={contactConfig.sheetId}
                  required
                  className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Admin Notification Email</label>
                <input
                  name="adminEmail"
                  type="email"
                  defaultValue={contactConfig.adminEmail}
                  required
                  className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                  placeholder="e.g. teaminfinitium.arsd@gmail.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingContactConfig}
                className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {isSavingContactConfig ? 'Saving settings...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}

        {/* Event Modal */}
        <AnimatePresence>
          {showAddEvent && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowAddEvent(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-3xl font-bold mb-8">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <form className="space-y-6" onSubmit={handleEventSubmit}>
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-full aspect-[16/10] max-w-[400px] rounded-2xl bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group mx-auto">
                      {eventImagePreview ? (
                        <img src={eventImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                          <Camera className="w-10 h-10" />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Poster Selected</span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" htmlFor="event-upload">
                        <Plus className="text-white w-10 h-10" />
                        <input id="event-upload" type="file" className="hidden" accept="image/*" onChange={handleEventFileChange} />
                      </label>
                    </div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center">
                      Click card to upload a poster image from your device
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Event Title</label>
                      <input
                        name="title"
                        defaultValue={editingEvent?.title || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. Pulsar 2026"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Subtitle</label>
                      <input
                        name="subtitle"
                        defaultValue={editingEvent?.subtitle || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. The Science extravaganza"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Event Type</label>
                      <select
                        name="type"
                        defaultValue={editingEvent?.type || 'Seminar'}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold outline-none"
                      >
                        <option value="Seminar">Seminar</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Competition">Competition</option>
                        <option value="Festival">Festival</option>
                        <option value="Lecture">Lecture</option>
                        <option value="Hackathon">Hackathon</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Event Date</label>
                      <input
                        name="date"
                        type="date"
                        defaultValue={editingEvent?.date || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Start Time (Optional)</label>
                      <input
                        name="startTime"
                        defaultValue={editingEvent?.startTime || ''}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. 10:00 AM"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Location</label>
                      <input
                        name="location"
                        defaultValue={editingEvent?.location || ''}
                        required
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. Seminar Hall, ARSD College"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">WhatsApp Group Link (Optional)</label>
                      <input
                        name="whatsappGroup"
                        defaultValue={editingEvent?.whatsappGroup || ''}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="e.g. https://chat.whatsapp.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Sync Spreadsheet ID (Optional)</label>
                      <input
                        name="sheetId"
                        defaultValue={editingEvent?.sheetId || ''}
                        className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                        placeholder="Google Sheet Spreadsheet ID"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-100">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest pl-1">Inter-College Event</label>
                      <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-tight pl-1">Allow students from other colleges to register</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isInterCollege"
                        value="true"
                        defaultChecked={editingEvent?.isInterCollege}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingEvent?.description}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 text-sm font-medium"
                      placeholder="Describe the event details..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isEventSubmitting || isEventImageProcessing}
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isEventSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      editingEvent ? 'Update Event' : 'Create Event'
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Achievement Modal */}
        <AnimatePresence>
          {showAchievementModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowAchievementModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-3xl font-bold mb-8">{editingAchievement ? 'Edit Achievement' : 'Add Achievement'}</h2>
                <form className="space-y-6" onSubmit={handleAchievementSubmit}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Title</label>
                    <input
                      name="title"
                      defaultValue={editingAchievement?.title || ''}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                      placeholder="e.g. Best Society Award 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Date</label>
                    <input
                      name="date"
                      type="date"
                      defaultValue={editingAchievement?.date || ''}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingAchievement?.description || ''}
                      required
                      className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 text-sm font-medium"
                      placeholder="Describe the achievement in detail..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                  >
                    {editingAchievement ? 'Update Achievement' : 'Add Achievement'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeGalleryModal} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
                <h2 className="text-3xl font-bold mb-8">{editingGallery ? 'Edit Gallery Item' : 'Add Gallery Image'}</h2>
                <form className="space-y-6" onSubmit={handleGallerySubmit}>
                   <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="w-full aspect-square max-w-[300px] rounded-2xl bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group mx-auto">
                        {galleryImagePreview ? (
                          <img src={galleryImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                            <Camera className="w-10 h-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No Image Selected</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" htmlFor="gallery-upload">
                          <Plus className="text-white w-10 h-10" />
                          <input id="gallery-upload" type="file" className="hidden" accept="image/*" onChange={handleGalleryFileChange} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center">
                        {isImageProcessing ? "Processing Image..." : "Click to upload photo from your device"}
                      </p>
                   </div>

                   <input 
                    name="title" 
                    defaultValue={editingGallery?.title}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 font-bold" 
                    placeholder="Image Title" 
                   />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Category</label>
                        <select 
                          name="category" 
                          defaultValue={editingGallery?.category || 'Events'}
                          required
                          className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold text-sm outline-none focus:border-brand-600 appearance-none" 
                        >
                          <option value="Events">Events</option>
                          <option value="Academic">Academic</option>
                          <option value="Team">Team</option>
                          <option value="Moments">Moments</option>
                          <option value="Trips">Trips</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Capture Date (Optional)</label>
                        <input 
                         name="eventDate" 
                         type="date"
                         defaultValue={editingGallery?.eventDate}
                         className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 font-bold text-sm" 
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Or Image URL</label>
                     <input 
                       name="src" 
                       value={galleryImagePreview || ''}
                       onChange={(e) => setGalleryImagePreview(e.target.value)}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 placeholder:text-zinc-300 transition-all font-mono text-xs" 
                       placeholder="https://..." 
                     />
                   </div>
                   <textarea 
                    name="description" 
                    defaultValue={editingGallery?.description}
                    required 
                    className="w-full px-5 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 h-32 placeholder:text-zinc-300" 
                    placeholder="Description of the moment"
                   ></textarea>
                   <button 
                    type="submit" 
                    disabled={isSubmittingGallery || isImageProcessing}
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                    {isSubmittingGallery ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      editingGallery ? 'Update Item' : 'Add to Gallery'
                    )}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-sm rounded-2xl p-10 shadow-2xl text-center"
             >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">Confirm Deletion</h3>
                <p className="text-sm text-zinc-500 mb-8 font-medium">Are you sure you want to delete this {deleteConfirm.type === 'member' ? 'team member' : deleteConfirm.type}? This action cannot be undone.</p>
                
                <div className="flex gap-4">
                   <button 
                     onClick={() => setDeleteConfirm(null)}
                     className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all font-bold"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={async () => {
                        if (deleteConfirm && deleteConfirm.id && deleteConfirm.type) {
                           const col = deleteConfirm.type === 'member' ? 'members' : 
                                       deleteConfirm.type === 'event' ? 'events' :
                                       deleteConfirm.type === 'gallery' ? 'gallery' : 'achievements';
                           try {
                              await deleteDoc(doc(db, col, deleteConfirm.id));
                              loadFirebaseData();
                              setDeleteConfirm(null);
                            } catch (err) {
                              console.error(err);
                            }
                        }
                     }}
                     className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
                   >
                     Clear Data
                   </button>
                </div>
             </motion.div>
          </div>
        )}

        {selectedCertEvent && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm overflow-y-auto">
            <div className="absolute inset-0" onClick={() => setSelectedCertEvent(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-7xl rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100 flex flex-col xl:flex-row gap-8 max-h-[90vh] overflow-y-auto xl:overflow-hidden z-[170]"
            >
              {/* Left Column: Form & Configuration */}
              <div className="flex-1 space-y-6 xl:max-h-[75vh] xl:overflow-y-auto xl:pr-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-50 rounded-full flex items-center justify-center border border-cyan-100">
                      <Award className="w-6 h-6 text-cyan-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Issue Event Certificates</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedCertEvent.title}</p>
                    </div>
                  </div>
                </div>

                {/* Info Cards / Registrants Counter */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 text-center">
                    <span className="block text-2xl font-black text-slate-800 font-mono">
                      {loadingRegistrants ? "..." : registrantsForCert.length}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100/50 rounded-2xl p-4 text-center">
                    <span className="block text-2xl font-black text-emerald-600 font-mono">
                      {loadingRegistrants ? "..." : registrantsForCert.filter(r => r.attended).length}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Present</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100/50 rounded-2xl p-4 text-center">
                    <span className="block text-2xl font-black text-amber-600 font-mono">
                      {loadingRegistrants ? "..." : registrantsForCert.filter(r => !r.attended).length}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Absent</span>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-3xl p-5 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">1. Set Certificate Template</span>
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer bg-white hover:bg-zinc-50/50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Download className="w-8 h-8 text-zinc-400 mb-2 rotate-180 text-center" />
                        <p className="text-xs text-zinc-500 font-semibold mb-1 text-center truncate max-w-sm px-4">
                          {pdfTemplateName ? `Selected: ${pdfTemplateName}` : "Click to select custom PDF template"}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest text-center">Supports .PDF formats</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPdfTemplateName(file.name);
                            const reader = new FileReader();
                            reader.onload = () => {
                              const arrayBuffer = reader.result as ArrayBuffer;
                              setPdfTemplateBytes(new Uint8Array(arrayBuffer));
                            };
                            reader.readAsArrayBuffer(file);
                          }
                        }}
                      />
                    </label>

                    {pdfTemplateBytes && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfTemplateBytes(null);
                          setPdfTemplateName('');
                        }}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-red-100/40"
                      >
                        Reset to Minimalist Built-in Template
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories & Configuration */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-3xl p-5 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">2. Text Placement & Design Categories</span>
                  
                  <div className="space-y-4">
                    {/* Name Config */}
                    <div className="space-y-2 border-b border-zinc-100 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedPlaceholders.name}
                            onChange={(e) => setSelectedPlaceholders(prev => ({ ...prev, name: e.target.checked }))}
                            className="w-4 h-4 text-cyan-600 rounded border-zinc-300 focus:ring-cyan-500"
                          />
                          <span>Student Name</span>
                        </label>
                        <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">PREVIEW VALUE: uppercase</span>
                      </div>
                      {selectedPlaceholders.name && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Vertical (Y): {textPositions.name.y}px</span>
                            <input
                              type="range"
                              min="50"
                              max="550"
                              value={textPositions.name.y}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, name: { ...prev.name, y: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Font Size: {textPositions.name.fontSize}px</span>
                            <input
                              type="range"
                              min="12"
                              max="48"
                              value={textPositions.name.fontSize}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, name: { ...prev.name, fontSize: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Course Config */}
                    <div className="space-y-2 border-b border-zinc-100 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedPlaceholders.course}
                            onChange={(e) => setSelectedPlaceholders(prev => ({ ...prev, course: e.target.checked }))}
                            className="w-4 h-4 text-cyan-600 rounded border-zinc-300 focus:ring-cyan-500"
                          />
                          <span>Course Title</span>
                        </label>
                      </div>
                      {selectedPlaceholders.course && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Vertical (Y): {textPositions.course.y}px</span>
                            <input
                              type="range"
                              min="50"
                              max="550"
                              value={textPositions.course.y}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, course: { ...prev.course, y: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Font Size: {textPositions.course.fontSize}px</span>
                            <input
                              type="range"
                              min="10"
                              max="32"
                              value={textPositions.course.fontSize}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, course: { ...prev.course, fontSize: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* College Config */}
                    <div className="space-y-2 border-b border-zinc-100 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedPlaceholders.college}
                            onChange={(e) => setSelectedPlaceholders(prev => ({ ...prev, college: e.target.checked }))}
                            className="w-4 h-4 text-cyan-600 rounded border-zinc-300 focus:ring-cyan-500"
                          />
                          <span>Event Name / College</span>
                        </label>
                      </div>
                      {selectedPlaceholders.college && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Vertical (Y): {textPositions.college.y}px</span>
                            <input
                              type="range"
                              min="50"
                              max="550"
                              value={textPositions.college.y}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, college: { ...prev.college, y: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Font Size: {textPositions.college.fontSize}px</span>
                            <input
                              type="range"
                              min="10"
                              max="32"
                              value={textPositions.college.fontSize}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, college: { ...prev.college, fontSize: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Year Config */}
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                          <input
                            type="checkbox"
                            checked={selectedPlaceholders.year}
                            onChange={(e) => setSelectedPlaceholders(prev => ({ ...prev, year: e.target.checked }))}
                            className="w-4 h-4 text-cyan-600 rounded border-zinc-300 focus:ring-cyan-500"
                          />
                          <span>Year of Study</span>
                        </label>
                      </div>
                      {selectedPlaceholders.year && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Vertical (Y): {textPositions.year.y}px</span>
                            <input
                              type="range"
                              min="50"
                              max="550"
                              value={textPositions.year.y}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, year: { ...prev.year, y: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block mb-1">Font Size: {textPositions.year.fontSize}px</span>
                            <input
                              type="range"
                              min="10"
                              max="32"
                              value={textPositions.year.fontSize}
                              onChange={(e) => setTextPositions(prev => ({ ...prev, year: { ...prev.year, fontSize: parseInt(e.target.value) } }))}
                              className="w-full accent-cyan-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status / Log Console */}
                {(certError || certSuccessMessage || sendingCertificates) && (
                  <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800 space-y-2">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 font-extrabold">Dispatch Console Output</span>
                    
                    {sendingCertificates && (
                      <div className="space-y-2 font-mono text-xs text-zinc-300">
                        <div className="flex justify-between text-[11px] text-cyan-400 animate-pulse">
                          <span>Progress: {certSendingProgress.sent} of {certSendingProgress.total}</span>
                          <span>{Math.round((certSendingProgress.sent / certSendingProgress.total) * 100)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="bg-cyan-400 h-full transition-all duration-300" 
                            style={{ width: `${(certSendingProgress.sent / certSendingProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 font-semibold italic text-ellipsis overflow-hidden whitespace-nowrap">
                          🚀 Packing & dispatching certificate for: {certSendingProgress.currentStudentName}...
                        </p>
                      </div>
                    )}

                    {certSuccessMessage && (
                      <p className="text-emerald-400 font-mono text-xs font-semibold">{certSuccessMessage}</p>
                    )}

                    {certError && (
                      <p className="text-red-400 font-mono text-xs font-semibold uppercase">{certError}</p>
                    )}
                  </div>
                )}

                {/* Buttons block */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedCertEvent(null)}
                    className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all font-bold"
                  >
                    Close Setup
                  </button>
                  <button
                    onClick={handleSendCertificates}
                    disabled={sendingCertificates || loadingRegistrants || registrantsForCert.filter(r => r.attended).length === 0}
                    className="flex-2 py-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-100 disabled:text-zinc-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 font-bold"
                  >
                    {sendingCertificates ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Sending {certSendingProgress.sent}/{certSendingProgress.total}...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Send Certificates</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: PDF Previews (First Generated Certificate) */}
              <div className="w-full xl:w-[540px] bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col gap-4 xl:max-h-[75vh] xl:overflow-y-auto">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1">
                    <span>3. Generated PDF Preview</span>
                    {generatingPreviews && <span className="text-cyan-500 text-[10px] lowercase italic">(regenerating...)</span>}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">
                    Displays how certificates look for marked attendees. Adjust vertical sliders to coordinate text layouts!
                  </p>
                </div>

                {loadingRegistrants ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                    <Clock className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono">Syncing sheets attendee rolls...</span>
                  </div>
                ) : registrantsForCert.filter(r => r.attended).length === 0 ? (
                  <div className="flex-1 border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-white">
                    <span className="text-2xl text-zinc-300">⚠️</span>
                    <span className="text-xs font-bold text-zinc-500 mt-2 uppercase tracking-wide">No attendants present</span>
                    <p className="text-[10px] text-zinc-400 leading-normal max-w-xs mt-1 text-center">
                      No registrants are currently marked as attended ("Yes" in column L) in Google Sheets for this event. 
                      Displaying default mock certificate sample preview.
                    </p>
                    <div className="w-full mt-4 flex flex-col gap-4">
                      {previewBlobUrls.slice(0, 1).map((url, idx) => (
                        <div key={idx} className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-zinc-950">
                          <div className="px-4 py-2 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <span className="text-[10px] font-black uppercase text-slate-500 truncate">
                              Sample Certificate Preview
                            </span>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer noopener"
                              className="p-1 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                              title="Open full sample certificate"
                            >
                              <span>Open PDF</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <iframe src={url + "#toolbar=0&navpanes=0&scrollbar=0"} className="w-full h-[390px]" title="Mock Preview" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewBlobUrls.slice(0, 1).map((url, index) => {
                      const student = registrantsForCert.filter(r => r.attended)[index] || { studentName: 'Attendant' };
                      return (
                        <div key={index} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                          <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-100/50">
                            <span className="text-[10px] font-black uppercase text-slate-500 truncate max-w-[240px]">
                              {student.studentName} ({student['collegeName'] || 'ARSD'})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold text-emerald-500 leading-none bg-emerald-50 px-2 py-1 rounded-full">Attended</span>
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noreferrer noopener"
                                className="p-1 px-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                                title="Open full certificate"
                              >
                                <span>Open PDF</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <div className="bg-zinc-800">
                            <iframe 
                              src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} 
                              className="w-full h-[390px]" 
                              title={`Preview ${index + 1}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showMemberModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeMemberModal} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
                <h2 className="text-3xl font-bold mb-8">
                  {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                </h2>
                <form onSubmit={handleMemberSubmit} className="space-y-6">
                   <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="w-32 h-32 rounded-2xl bg-zinc-50 border-4 border-zinc-100 overflow-hidden relative group">
                        {memberImagePreview ? (
                          <img src={memberImagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Camera className="w-10 h-10" />
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Plus className="text-white w-8 h-8" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleMemberFileChange} />
                        </label>
                      </div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Click to upload photo</p>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Full Name</label>
                     <input 
                       name="name" 
                       defaultValue={editingMember?.name}
                       required
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                       placeholder="e.g. Sneha Sharma" 
                     />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Role</label>
                       <input 
                         name="role" 
                         defaultValue={editingMember?.role}
                         required
                         className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                         placeholder="e.g. President" 
                       />
                     </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Tenure</label>
                        <div className="flex items-center gap-2">
                          <select 
                            name="startYear" 
                            defaultValue={editingMember?.tenure?.split('-')[0] || new Date().getFullYear()}
                            className="w-full px-4 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all font-bold text-sm"
                          >
                            {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() + 1) - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <span className="font-black text-zinc-300">-</span>
                          <select 
                            name="endYear" 
                            defaultValue={editingMember?.tenure ? '20' + editingMember.tenure.split('-')[1] : new Date().getFullYear() + 1}
                            className="w-full px-4 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all font-bold text-sm"
                          >
                            {Array.from({ length: 15 }, (_, i) => (new Date().getFullYear() + 2) - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Course Name</label>
                       <select 
                         name="course" 
                         defaultValue={editingMember?.course || 'B.Sc. Physical Science with Computer Science'}
                         required
                         className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all cursor-pointer"
                       >
                         <option value="B.Sc. Physical Science with Computer Science">B.Sc. Physical Science with Computer Science</option>
                         <option value="B.Sc. Physical Science with Chemistry">B.Sc. Physical Science with Chemistry</option>
                         <option value="B.Sc. Physical Science with Electronics">B.Sc. Physical Science with Electronics</option>
                         <option value="B.Sc. Applied Physical Science with Industrial Chemistry">B.Sc. Applied Physical Science with Industrial Chemistry</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Academic Year / Status</label>
                       <select 
                         name="year" 
                         defaultValue={editingMember?.year || 'I Year'}
                         required
                         className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all cursor-pointer"
                       >
                         <option value="I Year">I Year</option>
                         <option value="II Year">II Year</option>
                         <option value="III Year">III Year</option>
                         <option value="IV Year">IV Year</option>
                       </select>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">LinkedIn URL</label>
                     <input 
                       name="linkedin" 
                       defaultValue={editingMember?.linkedin}
                       className="w-full px-6 py-4 bg-zinc-50 rounded-2xl border-2 border-zinc-100 focus:border-brand-600 outline-none transition-all" 
                       placeholder="https://linkedin.com/..." 
                     />
                   </div>
                   <button 
                     type="submit"
                     className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-600 transition-all shadow-xl"
                   >
                     {editingMember ? 'Update Profile' : 'Add to Team'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
