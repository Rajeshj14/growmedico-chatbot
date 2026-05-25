// app//LeadsTable.tx
"use client";

import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Baby,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  treatment: string;
  procedure: string;
  message: string;
  city: string;
  age: string;
  consent: boolean;
  source: string;
  formName: string;
  status: "new" | "contacted" | "scheduled" | "converted" | "lost";
  telecrmSynced: boolean;
  telecrmId?: string;
  createdAt: string;
  updatedAt: string;

  // Smile Baby specific fields
  whatsappNumber?: string;
  womansAgeBracket?: string;
  tryingDuration?: string;
  isWhatsapp?: string;

  // Grow Medico consultation specific fields
  appointmentDateTime?: string;
  professionalBackground?: string;
  digitalExperience?: string;
  mainStruggle?: string;
  revenueMechanism?: string;
  platformPriorities?: string;
  ultimateGoal?: string;
  investmentMindset?: string;
  pageUrl?: string;
}

interface LeadsTableProps {
  initialLeads?: Lead[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function LeadsTable({
  initialLeads = [],
  autoRefresh = false,
  refreshInterval = 30000,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch leads from API
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads || []);
      } else {
        console.error("Failed to fetch leads:", data.error);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load leads on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLeads, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Sort leads
  const sortedLeads = [...leads].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue = a[key as keyof Lead];
    let bValue = b[key as keyof Lead];
    let aCompare: string | number = aValue as string;
    let bCompare: string | number = bValue as string;

    if (key === "createdAt" || key === "updatedAt") {
      aCompare = new Date(aValue as string).getTime();
      bCompare = new Date(bValue as string).getTime();
    } else if (typeof aValue === "string") {
      aCompare = aValue.toLowerCase();
      bCompare = (bValue as string).toLowerCase();
    }

    if (aCompare < bCompare) return direction === "asc" ? -1 : 1;
    if (aCompare > bCompare) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // Safe string conversion for filtering
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value).toLowerCase();
  };

  // Filter leads based on search and filters
  const filteredLeads = sortedLeads.filter((lead) => {
    const matchesSearch =
      safeString(lead.name).includes(safeString(searchTerm)) ||
      safeString(lead.phone).includes(safeString(searchTerm)) ||
      safeString(lead.email).includes(safeString(searchTerm)) ||
      safeString(lead.treatment).includes(safeString(searchTerm)) ||
      safeString(lead.message).includes(safeString(searchTerm)) ||
      safeString(lead.city).includes(safeString(searchTerm)) ||
      safeString(lead.formName).includes(safeString(searchTerm)) ||
      safeString(lead.womansAgeBracket).includes(safeString(searchTerm)) ||
      safeString(lead.tryingDuration).includes(safeString(searchTerm)) ||
      safeString(lead.professionalBackground).includes(safeString(searchTerm)) ||
      safeString(lead.digitalExperience).includes(safeString(searchTerm)) ||
      safeString(lead.mainStruggle).includes(safeString(searchTerm)) ||
      safeString(lead.revenueMechanism).includes(safeString(searchTerm)) ||
      safeString(lead.platformPriorities).includes(safeString(searchTerm)) ||
      safeString(lead.ultimateGoal).includes(safeString(searchTerm)) ||
      safeString(lead.investmentMindset).includes(safeString(searchTerm));

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesTreatment = treatmentFilter === "all" || lead.treatment === treatmentFilter;
    const matchesDate = dateFilter === "all" || isWithinDateRange(lead.createdAt, dateFilter);
    const matchesForm = formFilter === "all" || lead.formName === formFilter;

    return matchesSearch && matchesStatus && matchesTreatment && matchesDate && matchesForm;
  });

  function isWithinDateRange(date: string, range: string): boolean {
    if (!date) return false;

    const leadDate = new Date(date);
    const now = new Date();

    switch (range) {
      case "today":
        return leadDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return leadDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return leadDate >= monthAgo;
      default:
        return true;
    }
  }

  const getStatusBadge = (status: Lead["status"]) => {
    const statusConfig = {
      new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
      contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-800 border-purple-200" },
      converted: { label: "Converted", color: "bg-green-100 text-green-800 border-green-200" },
      lost: { label: "Lost", color: "bg-red-100 text-red-800 border-red-200" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const getFormBadge = (formName: string) => {
    if (!formName) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
          Unknown
        </Badge>
      );
    }

    const formConfig: { [key: string]: { label: string; color: string; icon?: any } } = {
      "hair consultation": {
        label: "Hair Consultation",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      },
      "skin consultation": {
        label: "Skin Consultation",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      },
      "smile baby": {
        label: "Smile Baby",
        color: "bg-pink-100 text-pink-800 border-pink-200",
        icon: Baby,
      },
      "grow medico consultation": {
        label: "Grow Medico Consultation",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      default: { label: formName, color: "bg-gray-100 text-gray-800 border-gray-200" },
    };

    const config = formConfig[formName.toLowerCase()] || formConfig.default;
    return (
      <Badge variant="outline" className={`${config.color} border text-xs flex items-center gap-1`}>
        {config.icon && <Baby className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const getTelecrmBadge = (synced: boolean) => {
    return synced ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">Synced</Badge>
    ) : (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Pending
      </Badge>
    );
  };

  // Get unique form names for filter
  const uniqueFormNames = Array.from(new Set(leads.map((lead) => lead.formName).filter(Boolean)));

  // Get statistics
  const getFormStats = () => {
    const stats: {
      [key: string]: { total: number; new: number; converted: number; synced: number };
    } = {};

    leads.forEach((lead) => {
      const formName = lead.formName || "Unknown";
      if (!stats[formName]) {
        stats[formName] = { total: 0, new: 0, converted: 0, synced: 0 };
      }

      stats[formName].total++;
      if (lead.status === "new") stats[formName].new++;
      if (lead.status === "converted") stats[formName].converted++;
      if (lead.telecrmSynced) stats[formName].synced++;
    });

    return stats;
  };

  const formStats = getFormStats();

  const menuSurfaceStyle = {
    backgroundColor: "#ffffff",
    borderColor: "#bcd8d4",
    borderRadius: "12px",
    boxShadow: "0 22px 55px rgba(5, 35, 34, 0.18)",
    color: "#102326",
    padding: "8px",
    zIndex: 1000,
  };

  const menuItemStyle = {
    borderRadius: "9px",
    color: "#102326",
    fontWeight: 700,
    padding: "10px 12px",
  };

  const detailLabelStyle = {
    color: "#102326",
    fontWeight: 800,
  };

  const messageLabelPattern =
    /(Professional Background|Digital Experience|Main Struggle|Revenue Mechanism|Platform Priorities|Ultimate Goal|Investment Mindset|Budget Fit|Appointment|Page URL|Consent|Source):/g;

  const renderMessage = (message?: string) => {
    if (!message) return "No message provided";

    const matches = [...message.matchAll(messageLabelPattern)];
    if (matches.length === 0) return message;

    return (
      <div className="lead-message-list">
        {matches.map((match, index) => {
          const label = match[1];
          const valueStart = (match.index ?? 0) + match[0].length;
          const valueEnd = matches[index + 1]?.index ?? message.length;
          const value = message.slice(valueStart, valueEnd).trim();

          return (
            <div className="lead-message-row" key={`${label}-${index}`}>
              <strong>{label}</strong>
              <span>{value || "Not specified"}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMessageText = (message?: string) => {
    if (!message) return "No message provided";

    return message.split(messageLabelPattern).map((part, index) => {
      if (index % 2 === 1)
        return (
          <strong key={`${part}-${index}`} style={detailLabelStyle}>
            {part}:
          </strong>
        );

      return part;
    });
  };

  const dashboardStyles = `
    .admin-dashboard {
      min-height: 100vh;
      background:
        radial-gradient(circle at 12% 0%, rgba(7, 155, 143, 0.14), transparent 34%),
        linear-gradient(180deg, #f6fbfa 0%, #eef7f5 100%);
      color: #102326;
      padding: 28px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }

    .admin-dashboard svg {
      width: 18px;
      height: 18px;
      stroke-width: 2;
      flex: 0 0 auto;
    }

    .admin-dashboard > div {
      width: 100%;
      background: #ffffff;
      border: 1px solid #d7e8e5;
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(5, 35, 34, 0.10);
      overflow: hidden;
    }

    .admin-dashboard > div > div:first-child {
      padding: 24px 28px;
      border-bottom: 1px solid #d7e8e5;
      background: linear-gradient(135deg, #ffffff 0%, #f1fbf9 100%);
    }

    .admin-dashboard > div > div:first-child > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .admin-dashboard h1,
    .admin-dashboard [class*="CardTitle"],
    .admin-dashboard [class*="text-2xl"] {
      margin: 0;
      color: #102326;
      font-size: 24px;
      line-height: 1.15;
      font-weight: 700;
    }

    .admin-dashboard [class*="CardDescription"],
    .admin-dashboard [class*="text-gray-600"] {
      color: #5f7478;
    }

    .admin-dashboard button {
      border: 1px solid #c9dfdc;
      border-radius: 6px;
      background: #ffffff;
      color: #153d40;
      min-height: 38px;
      padding: 0 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font: inherit;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    }

    .admin-dashboard button:hover {
      background: #eef8f7;
      border-color: #079b8f;
      color: #063f3d;
    }

    .admin-dashboard [class*="bg-blue-600"] {
      background: #079b8f;
      border-color: #079b8f;
      color: #ffffff;
    }

    .admin-dashboard [class*="bg-blue-600"]:hover {
      background: #067f76;
      color: #ffffff;
    }

    .admin-dashboard > div > div:last-child {
      padding: 24px 28px 28px;
    }

    .admin-dashboard [class*="lg:grid-cols-4"] {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 22px;
    }

    .admin-dashboard [class*="lg:grid-cols-4"] > div {
      padding: 18px;
      border: 1px solid #d7e8e5;
      border-radius: 8px;
      background: #fbfefd;
      box-shadow: 0 10px 28px rgba(5, 35, 34, 0.06);
    }

    .admin-dashboard [class*="lg:grid-cols-4"] > div > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .admin-dashboard [class*="text-2xl"] {
      font-size: 28px;
      margin-top: 6px;
    }

    .admin-dashboard .admin-filters {
      display: grid;
      grid-template-columns: minmax(360px, 2.6fr) minmax(150px, 0.85fr) minmax(190px, 1fr) minmax(190px, 1fr) minmax(170px, 0.9fr);
      gap: 18px;
      align-items: center;
      padding: 20px 22px;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #f7fcfb 0%, #eef8f6 100%);
      border: 1px solid #d7e8e5;
      border-radius: 8px;
    }

    .admin-dashboard .admin-search,
    .admin-dashboard .admin-filter-control {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .admin-dashboard .admin-search-field {
      position: relative;
      width: 100%;
      height: 50px;
    }

    .admin-dashboard .admin-search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #5f7478;
      pointer-events: none;
      z-index: 1;
    }

    .admin-dashboard input {
      width: 100%;
      height: 50px;
      min-height: 50px;
      box-sizing: border-box;
      border: 1px solid #c9dfdc;
      border-radius: 10px;
      background: #ffffff;
      color: #102326;
      padding: 0 16px 0 48px;
      font: inherit;
      font-size: 15px;
      line-height: 50px;
      outline: none;
      box-shadow: 0 1px 0 rgba(5, 35, 34, 0.04);
    }

    .admin-dashboard input:focus,
    .admin-dashboard button:focus-visible {
      border-color: #079b8f;
      box-shadow: 0 0 0 3px rgba(7, 155, 143, 0.14);
    }

    .admin-dashboard [class*="relative"] {
      position: relative;
    }

    .admin-dashboard [class*="absolute"] {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7f83;
      pointer-events: none;
    }

    .admin-dashboard [role="combobox"] {
      width: 100%;
      height: 50px;
      min-height: 50px;
      box-sizing: border-box;
      justify-content: space-between;
      background: #ffffff;
      border-radius: 10px;
      color: #102326;
      font-weight: 800;
      box-shadow: 0 1px 0 rgba(5, 35, 34, 0.04);
    }

    .admin-dashboard [role="combobox"] span {
      min-width: 0;
      color: #102326;
      font-weight: 800;
    }

    .admin-select-content {
      min-width: var(--radix-select-trigger-width);
      background: #ffffff !important;
      border: 1px solid #bcd8d4 !important;
      color: #102326 !important;
      box-shadow: 0 22px 55px rgba(5, 35, 34, 0.18) !important;
    }

    .admin-select-item,
    .admin-dropdown-item {
      cursor: pointer;
      color: #102326 !important;
      font-size: 14px;
      line-height: 1.2;
      transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
    }

    .admin-select-item[data-highlighted],
    .admin-dropdown-item[data-highlighted] {
      background: #e8f7f5 !important;
      color: #063f3d !important;
      transform: translateX(2px);
    }

    .admin-dashboard [class*="rounded-lg"][class*="overflow-hidden"] {
      border: 1px solid #d7e8e5;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
    }

    .admin-dashboard table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 14px;
    }

    .admin-dashboard thead {
      background: #f4faf9;
      border-bottom: 1px solid #d7e8e5;
    }

    .admin-dashboard th {
      height: 48px;
      padding: 0 16px;
      color: #536a6e;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .admin-dashboard td {
      padding: 16px;
      border-bottom: 1px solid #e4efed;
      color: #102326;
      vertical-align: middle;
    }

    .admin-dashboard tbody tr {
      transition: background 0.16s ease;
    }

    .admin-dashboard tbody tr:hover {
      background: #f8fcfb;
    }

    .admin-dashboard span {
      line-height: 1.35;
    }

    .admin-dashboard [class*="truncate"] {
      display: block;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .admin-dashboard [class*="bg-emerald-100"],
    .admin-dashboard [class*="bg-blue-100"],
    .admin-dashboard [class*="bg-yellow-100"],
    .admin-dashboard [class*="bg-green-100"] {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      width: fit-content;
    }

    .admin-dashboard [class*="bg-emerald-100"] {
      background: #dff7f2;
      color: #08756d;
      border: 1px solid #a9ded7;
    }

    .admin-dashboard [class*="bg-blue-100"] {
      background: #e7f0ff;
      color: #1d55a6;
      border: 1px solid #c7d9ff;
    }

    .admin-dashboard [class*="bg-yellow-100"] {
      background: #fff7dd;
      color: #8a6109;
      border: 1px solid #f2dda0;
    }

    .admin-dashboard [class*="bg-green-100"] {
      background: #e4f8e9;
      color: #1f7a3d;
      border: 1px solid #bde7c8;
    }

    .admin-dashboard td button {
      width: 36px;
      height: 36px;
      min-height: 36px;
      padding: 0;
    }

    .admin-dashboard [class*="mt-4"] {
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: #5f7478;
      font-size: 13px;
    }

    .admin-dashboard .lead-expanded-row {
      display: grid;
      grid-template-columns: minmax(420px, 0.95fr) minmax(520px, 1.05fr);
      gap: 18px;
      align-items: stretch;
      padding: 18px;
      border: 1px solid #d7e8e5;
      border-radius: 8px;
      background: linear-gradient(135deg, #f7fcfb 0%, #eff8f6 100%);
    }

    .admin-dashboard .lead-detail-card {
      min-width: 0;
      border: 1px solid #d4e8e5;
      border-radius: 8px;
      background: #ffffff;
      padding: 20px;
      box-shadow: 0 12px 28px rgba(5, 35, 34, 0.06);
    }

    .admin-dashboard .lead-detail-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e4efed;
      color: #102326;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0;
    }

    .admin-dashboard .lead-detail-title::before {
      content: "";
      width: 4px;
      height: 18px;
      border-radius: 999px;
      background: #079b8f;
      flex: 0 0 auto;
    }

    .admin-dashboard .lead-detail-list {
      display: grid;
      gap: 0;
      color: #294448;
    }

    .admin-dashboard .lead-detail-row {
      display: grid;
      grid-template-columns: minmax(150px, 180px) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding: 10px 0;
      border-bottom: 1px solid #edf4f3;
    }

    .admin-dashboard .lead-detail-row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .admin-dashboard .lead-detail-card strong {
      color: #102326;
      font-weight: 800;
      line-height: 1.4;
    }

    .admin-dashboard .lead-detail-row > span,
    .admin-dashboard .lead-message-row > span {
      min-width: 0;
      color: #294448;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .admin-dashboard .lead-message {
      margin: 0;
      border: 1px solid #d7e8e5;
      border-radius: 8px;
      background: #fbfefd;
      color: #294448;
      line-height: 1.65;
      padding: 6px 16px;
    }

    .admin-dashboard .lead-message-list {
      display: grid;
      gap: 0;
    }

    .admin-dashboard .lead-message-row {
      display: grid;
      grid-template-columns: minmax(160px, 190px) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding: 12px 0;
      border-bottom: 1px solid #edf4f3;
    }

    .admin-dashboard .lead-message-row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .admin-dashboard .lead-message-row strong {
      color: #102326;
      font-weight: 800;
      line-height: 1.4;
    }

    @media (max-width: 980px) {
      .admin-dashboard {
        padding: 16px;
      }

      .admin-dashboard > div > div:first-child > div,
      .admin-dashboard [class*="mt-4"] {
        flex-direction: column;
        align-items: flex-start;
      }

      .admin-dashboard [class*="lg:grid-cols-4"],
      .admin-dashboard .admin-filters {
        grid-template-columns: 1fr;
      }

      .admin-dashboard th,
      .admin-dashboard td {
        padding: 12px;
      }

      .admin-dashboard .lead-detail-row {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      .admin-dashboard .lead-message-row {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      .admin-dashboard .lead-expanded-row {
        grid-template-columns: 1fr;
      }
    }
  `;

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Treatment",
      "Message",
      "City",
      "Age",
      "Status",
      "Form Name",
      "Source",
      "TeleCRM Synced",
      "Created At",
      // Smile Baby specific fields
      "WhatsApp",
      "Woman's Age Bracket",
      "Trying Duration",
      // Grow Medico consultation specific fields
      "Appointment DateTime",
      "Professional Background",
      "Digital Experience",
      "Main Struggle",
      "Revenue Mechanism",
      "Platform Priorities",
      "Ultimate Goal",
      "Investment Mindset",
      "Page URL",
    ];

    const csvData = filteredLeads.map((lead) => [
      lead.name || "",
      lead.phone || "",
      lead.email || "",
      lead.treatment || "",
      `"${(lead.message || "").replace(/"/g, '""')}"`,
      lead.city || "",
      lead.age || "",
      lead.status || "",
      lead.formName || "",
      lead.source || "",
      lead.telecrmSynced ? "Yes" : "No",
      isClient ? new Date(lead.createdAt).toLocaleString("en-IN") : lead.createdAt,
      lead.isWhatsapp || lead.whatsappNumber || "",
      lead.womansAgeBracket || "",
      lead.tryingDuration || "",
      lead.appointmentDateTime || "",
      `"${(lead.professionalBackground || "").replace(/"/g, '""')}"`,
      `"${(lead.digitalExperience || "").replace(/"/g, '""')}"`,
      `"${(lead.mainStruggle || "").replace(/"/g, '""')}"`,
      `"${(lead.revenueMechanism || "").replace(/"/g, '""')}"`,
      `"${(lead.platformPriorities || "").replace(/"/g, '""')}"`,
      `"${(lead.ultimateGoal || "").replace(/"/g, '""')}"`,
      `"${(lead.investmentMindset || "").replace(/"/g, '""')}"`,
      lead.pageUrl || "",
    ]);

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, "_self");
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`, "_self");
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleLeadExpansion = (leadId: string) => {
    setExpandedLead((current) => (current === leadId ? null : leadId));
  };

  const updateLeadStatus = async (leadId: string, newStatus: Lead["status"]) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setLeads(leads.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead)));
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  // Format date safely for client-side rendering
  const formatDate = (dateString: string) => {
    if (!isClient || !dateString) return { date: "", time: "" };

    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString("en-IN"),
        time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "Invalid Date", time: "" };
    }
  };

  return (
    <div className="admin-dashboard">
      <style>{dashboardStyles}</style>
      <Card className="w-full bg-white border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-start sm:items-center gap-5">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Leads Management</CardTitle>
              <CardDescription className="text-gray-600">
                Manage and track all consultation requests from your website forms
                {autoRefresh && (
                  <span className="ml-2 text-xs text-green-600">• Auto-refresh enabled</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-6" style={{ display: "flex", gap: "24px" }}>
              <Button
                variant="outline"
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Form Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(formStats).map(([formName, stats]) => (
              <Card key={formName} className="p-4 bg-white border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {formName.toLowerCase() === "smile baby" ? (
                        <Baby className="h-4 w-4 text-pink-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-medium text-sm text-gray-900 capitalize">
                        {formName === "hair consultation"
                          ? "Hair Consultation"
                          : formName === "skin consultation"
                            ? "Skin Consultation"
                            : formName === "smile baby"
                              ? "Smile Baby"
                              : formName === "Grow Medico Consultation"
                                ? "Grow Medico Consultation"
                                : formName === "Unknown"
                                  ? "Unknown Form"
                                  : formName}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  </div>
                  <div className="text-right text-xs space-y-1">
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">New: {stats.new}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Converted: {stats.converted}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-gray-600">Synced: {stats.synced}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <div className="admin-search">
              <div className="admin-search-field">
                <Search className="admin-search-icon h-5 w-5" />
                <Input
                  placeholder="Search by name, phone, email, treatment, form..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="admin-filter-control bg-white border-gray-300 text-gray-900">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent
                className="admin-select-content bg-white border-gray-300 text-gray-900"
                style={menuSurfaceStyle}
              >
                <SelectItem value="all" className="admin-select-item" style={menuItemStyle}>
                  All Status
                </SelectItem>
                <SelectItem value="new" className="admin-select-item" style={menuItemStyle}>
                  New
                </SelectItem>
                <SelectItem value="contacted" className="admin-select-item" style={menuItemStyle}>
                  Contacted
                </SelectItem>
                <SelectItem value="scheduled" className="admin-select-item" style={menuItemStyle}>
                  Scheduled
                </SelectItem>
                <SelectItem value="converted" className="admin-select-item" style={menuItemStyle}>
                  Converted
                </SelectItem>
                <SelectItem value="lost" className="admin-select-item" style={menuItemStyle}>
                  Lost
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
              <SelectTrigger className="admin-filter-control bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder="Treatment" />
              </SelectTrigger>
              <SelectContent
                className="admin-select-content bg-white border-gray-300 text-gray-900"
                style={menuSurfaceStyle}
              >
                <SelectItem value="all" className="admin-select-item" style={menuItemStyle}>
                  All Treatments
                </SelectItem>
                <SelectItem value="ICSI" className="admin-select-item" style={menuItemStyle}>
                  ICSI
                </SelectItem>
                <SelectItem value="IUI" className="admin-select-item" style={menuItemStyle}>
                  IUI
                </SelectItem>
                <SelectItem
                  value="Egg Freezing"
                  className="admin-select-item"
                  style={menuItemStyle}
                >
                  Egg Freezing
                </SelectItem>
                <SelectItem
                  value="Embryo Freezing"
                  className="admin-select-item"
                  style={menuItemStyle}
                >
                  Embryo Freezing
                </SelectItem>
                <SelectItem
                  value="Hair fall / excessive shedding"
                  className="admin-select-item"
                  style={menuItemStyle}
                >
                  Hair Fall
                </SelectItem>
                <SelectItem
                  value="Thinning / reduced density"
                  className="admin-select-item"
                  style={menuItemStyle}
                >
                  Thinning
                </SelectItem>
                <SelectItem
                  value="Dandruff / flaky, itchy scalp"
                  className="admin-select-item"
                  style={menuItemStyle}
                >
                  Dandruff
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger className="admin-filter-control bg-white border-gray-300 text-gray-900">
                <Users className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Form" />
              </SelectTrigger>
              <SelectContent
                className="admin-select-content bg-white border-gray-300 text-gray-900"
                style={menuSurfaceStyle}
              >
                <SelectItem value="all" className="admin-select-item" style={menuItemStyle}>
                  All Forms
                </SelectItem>
                {uniqueFormNames.map((formName) => (
                  <SelectItem
                    key={formName}
                    value={formName}
                    className="admin-select-item"
                    style={menuItemStyle}
                  >
                    {formName === "hairtreatment"
                      ? "Hair Treatment"
                      : formName === "skin and hair leads"
                        ? "Skin & Hair"
                        : formName === "smile baby"
                          ? "Smile Baby"
                          : formName === "Grow Medico Consultation"
                            ? "Grow Medico Consultation"
                            : formName === "Unknown"
                              ? "Unknown Form"
                              : formName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="admin-filter-control bg-white border-gray-300 text-gray-900">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent
                className="admin-select-content bg-white border-gray-300 text-gray-900"
                style={menuSurfaceStyle}
              >
                <SelectItem value="all" className="admin-select-item" style={menuItemStyle}>
                  All Time
                </SelectItem>
                <SelectItem value="today" className="admin-select-item" style={menuItemStyle}>
                  Today
                </SelectItem>
                <SelectItem value="week" className="admin-select-item" style={menuItemStyle}>
                  This Week
                </SelectItem>
                <SelectItem value="month" className="admin-select-item" style={menuItemStyle}>
                  This Month
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="h-12 px-4 text-left align-middle font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortConfig?.key === "name" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">
                      Contact
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">
                      Treatment/Details
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">
                      Form
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">
                      Sync
                    </th>
                    <th
                      className="h-12 px-4 text-left align-middle font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortConfig?.key === "createdAt" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading leads...
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No leads found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const formattedDate = formatDate(lead.createdAt);
                      const isSmileBaby = lead.formName?.toLowerCase() === "smile baby";
                      const isGrowMedicoConsultation =
                        lead.formName?.toLowerCase() === "grow medico consultation";

                      return (
                        <Fragment key={lead.id}>
                          <tr
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => toggleLeadExpansion(lead.id)}
                          >
                            <td className="p-4 align-middle font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    lead.status === "new"
                                      ? "bg-blue-500"
                                      : lead.status === "contacted"
                                        ? "bg-yellow-500"
                                        : lead.status === "scheduled"
                                          ? "bg-purple-500"
                                          : lead.status === "converted"
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                  }`}
                                />
                                {lead.name || "Unknown"}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-blue-600" />
                                  <span className="text-sm text-gray-700">
                                    {lead.phone || "No phone"}
                                  </span>
                                </div>
                                {lead.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
                                      {lead.email}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex flex-col gap-1">
                                {isSmileBaby ? (
                                  <>
                                    <span className="text-sm font-medium text-gray-900">
                                      Smile Baby Consultation
                                    </span>
                                    {lead.womansAgeBracket && (
                                      <span className="text-xs text-gray-600">
                                        Age: {lead.womansAgeBracket}
                                      </span>
                                    )}
                                    {lead.tryingDuration && (
                                      <span className="text-xs text-gray-600">
                                        Trying: {lead.tryingDuration}
                                      </span>
                                    )}
                                  </>
                                ) : isGrowMedicoConsultation ? (
                                  <>
                                    <span className="text-sm font-medium text-gray-900">
                                      Personal Branding Consultation
                                    </span>
                                    {lead.appointmentDateTime && (
                                      <span className="text-xs text-gray-600">
                                        Slot: {lead.appointmentDateTime}
                                      </span>
                                    )}
                                    {lead.ultimateGoal && (
                                      <span className="text-xs text-gray-600 truncate max-w-[220px]">
                                        {lead.ultimateGoal}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm font-medium text-gray-900">
                                      {lead.treatment || lead.procedure || "Not specified"}
                                    </span>
                                    {lead.city && (
                                      <span className="text-xs text-gray-600">{lead.city}</span>
                                    )}
                                    {lead.age && (
                                      <span className="text-xs text-gray-600">Age: {lead.age}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle">{getFormBadge(lead.formName)}</td>
                            <td className="p-4 align-middle">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div className="cursor-pointer">
                                    {getStatusBadge(lead.status)}
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="admin-select-content bg-white border-gray-200 text-gray-900"
                                  style={menuSurfaceStyle}
                                >
                                  <DropdownMenuItem
                                    className="admin-dropdown-item"
                                    style={menuItemStyle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateLeadStatus(lead.id, "new");
                                    }}
                                  >
                                    New
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="admin-dropdown-item"
                                    style={menuItemStyle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateLeadStatus(lead.id, "contacted");
                                    }}
                                  >
                                    Contacted
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="admin-dropdown-item"
                                    style={menuItemStyle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateLeadStatus(lead.id, "scheduled");
                                    }}
                                  >
                                    Scheduled
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="admin-dropdown-item"
                                    style={menuItemStyle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateLeadStatus(lead.id, "converted");
                                    }}
                                  >
                                    Converted
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="admin-dropdown-item"
                                    style={menuItemStyle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateLeadStatus(lead.id, "lost");
                                    }}
                                  >
                                    Lost
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                            <td className="p-4 align-middle">
                              {getTelecrmBadge(lead.telecrmSynced)}
                            </td>
                            <td className="p-4 align-middle text-sm text-gray-600">
                              {formattedDate.date}
                              <br />
                              <span className="text-xs">{formattedDate.time}</span>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCall(lead.phone);
                                  }}
                                  disabled={!lead.phone}
                                >
                                  <Phone className="h-3 w-3" />
                                </Button>
                                {lead.email && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmail(lead.email);
                                    }}
                                  >
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedLead === lead.id && (
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <td colSpan={8} className="p-4">
                                <div className="lead-expanded-row text-sm">
                                  <div className="lead-detail-card">
                                    <h4 className="lead-detail-title">Lead Details</h4>
                                    <div className="lead-detail-list">
                                      <div className="lead-detail-row">
                                        <strong>Source</strong>
                                        <span>{lead.source || "Not specified"}</span>
                                      </div>

                                      {isSmileBaby ? (
                                        <>
                                          <div className="lead-detail-row">
                                            <strong>Woman's Age Bracket</strong>
                                            <span>{lead.womansAgeBracket || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Trying Duration</strong>
                                            <span>{lead.tryingDuration || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>WhatsApp</strong>
                                            <span>
                                              {lead.isWhatsapp ||
                                                lead.whatsappNumber ||
                                                "Not specified"}
                                            </span>
                                          </div>
                                        </>
                                      ) : isGrowMedicoConsultation ? (
                                        <>
                                          <div className="lead-detail-row">
                                            <strong>Appointment</strong>
                                            <span>
                                              {lead.appointmentDateTime || "Not specified"}
                                            </span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Professional Background</strong>
                                            <span>
                                              {lead.professionalBackground || "Not specified"}
                                            </span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Digital Experience</strong>
                                            <span>{lead.digitalExperience || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Main Struggle</strong>
                                            <span>{lead.mainStruggle || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Revenue Mechanism</strong>
                                            <span>{lead.revenueMechanism || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Platform Priorities</strong>
                                            <span>
                                              {lead.platformPriorities || "Not specified"}
                                            </span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Ultimate Goal</strong>
                                            <span>{lead.ultimateGoal || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Investment Mindset</strong>
                                            <span>{lead.investmentMindset || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>Page URL</strong>
                                            <span>{lead.pageUrl || "Not specified"}</span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="lead-detail-row">
                                            <strong>Age</strong>
                                            <span>{lead.age || "Not specified"}</span>
                                          </div>
                                          <div className="lead-detail-row">
                                            <strong>City</strong>
                                            <span>{lead.city || "Not specified"}</span>
                                          </div>
                                        </>
                                      )}

                                      <div className="lead-detail-row">
                                        <strong>Consent</strong>
                                        <span>{lead.consent ? "Yes" : "No"}</span>
                                      </div>
                                      {lead.telecrmId && (
                                        <div className="lead-detail-row">
                                          <strong>TeleCRM ID</strong>
                                          <span>{lead.telecrmId}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="lead-detail-card">
                                    <h4 className="lead-detail-title">Message</h4>
                                    <div className="lead-message">
                                      {renderMessage(lead.message)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 text-sm text-gray-600 gap-2">
            <div>
              Showing {filteredLeads.length} of {leads.length} leads
              {searchTerm && ` • Filtered by: "${searchTerm}"`}
              {formFilter !== "all" &&
                ` • Form: ${
                  formFilter === "hair consultation"
                    ? "Hair Consultation"
                    : formFilter === "skin consultation"
                      ? "Skin Consultation"
                      : formFilter === "smile baby"
                        ? "Smile Baby"
                        : formFilter === "Grow Medico Consultation"
                          ? "Grow Medico Consultation"
                          : formFilter === "Unknown"
                            ? "Unknown Form"
                            : formFilter
                }`}
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>New: {leads.filter((l) => l.status === "new").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Converted: {leads.filter((l) => l.status === "converted").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Synced: {leads.filter((l) => l.telecrmSynced).length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
