export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'teacher' | 'admin'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type EnrollmentMode = 'Automatic' | 'Manual'
export type NotificationType = 'course' | 'grade' | 'assignment' | 'discussion'
export type AnnouncementCategory = 'Urgent' | 'Update' | 'Notice' | 'Event' | 'Exam'
export type AnnouncementPriority = 'Low' | 'Medium' | 'High'
export type AnnouncementStatus = 'Draft' | 'Published' | 'Archived'

export type Database = {
  public: {
    Tables: {
      levels: {
        Row: {
          id: string
          name: string
          level_number: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          level_number: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          level_number?: number
          created_at?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          id: string
          level_id: string
          name: string
          semester_number: number
          enrollment_mode: EnrollmentMode
          created_at: string
        }
        Insert: {
          id?: string
          level_id: string
          name: string
          semester_number: number
          enrollment_mode?: EnrollmentMode
          created_at?: string
        }
        Update: {
          id?: string
          level_id?: string
          name?: string
          semester_number?: number
          enrollment_mode?: EnrollmentMode
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          }
        ]
      }
      student_courses: {
        Row: {
          id: string
          student_id: string
          course_id: string
          progress: number
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          progress?: number
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          progress?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          bio: string | null
          student_id: string | null
          level_id: string | null
          academic_year: number | null
          department: string | null
          semester: number | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          bio?: string | null
          student_id?: string | null
          level_id?: string | null
          academic_year?: number | null
          department?: string | null
          semester?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          bio?: string | null
          student_id?: string | null
          level_id?: string | null
          academic_year?: number | null
          department?: string | null
          semester?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          }
        ]
      }
      academic_rules: {
        Row: {
          id: string
          prefix: string
          level_id: string | null
          academic_year: number | null
          department: string | null
          semester: number | null
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prefix: string
          level_id?: string | null
          academic_year?: number | null
          department?: string | null
          semester?: number | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prefix?: string
          level_id?: string | null
          academic_year?: number | null
          department?: string | null
          semester?: number | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_rules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          title: string
          code: string | null
          description: string | null
          thumbnail_url: string | null
          image_url: string | null
          teacher_id: string | null
          doctor_id: string | null
          semester_id: string | null
          category: string | null
          level: CourseLevel
          is_active: boolean
          department: string | null
          academic_year: number | null
          semester: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          code?: string | null
          description?: string | null
          thumbnail_url?: string | null
          image_url?: string | null
          teacher_id?: string | null
          doctor_id?: string | null
          semester_id?: string | null
          category?: string | null
          level?: CourseLevel
          is_active?: boolean
          department?: string | null
          academic_year?: number | null
          semester?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          code?: string | null
          description?: string | null
          thumbnail_url?: string | null
          image_url?: string | null
          teacher_id?: string | null
          doctor_id?: string | null
          semester_id?: string | null
          category?: string | null
          level?: CourseLevel
          is_active?: boolean
          department?: string | null
          academic_year?: number | null
          semester?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          content: string | null
          video_url: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          content?: string | null
          video_url?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          content?: string | null
          video_url?: string | null
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          enrolled_at: string
          progress: number
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          enrolled_at?: string
          progress?: number
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          enrolled_at?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          due_date: string | null
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          due_date?: string | null
          max_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          max_score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          file_url: string | null
          submitted_at: string
          grade: number | null
          feedback: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          file_url?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          file_url?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      grades: {
        Row: {
          id: string
          course_id: string
          student_id: string
          grade: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          grade?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          grade?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: NotificationType | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type?: NotificationType | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: NotificationType | null
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      discussions: {
        Row: {
          id: string
          course_id: string
          user_id: string | null
          title: string
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          user_id?: string | null
          title: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string | null
          title?: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      discussion_replies: {
        Row: {
          id: string
          discussion_id: string
          user_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          category: AnnouncementCategory
          priority: AnnouncementPriority
          status: AnnouncementStatus
          image_url: string | null
          external_url: string | null
          pinned: boolean
          published_date: string | null
          created_at: string
          updated_at: string
          author_id: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: AnnouncementCategory
          priority?: AnnouncementPriority
          status?: AnnouncementStatus
          image_url?: string | null
          external_url?: string | null
          pinned?: boolean
          published_date?: string | null
          created_at?: string
          updated_at?: string
          author_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: AnnouncementCategory
          priority?: AnnouncementPriority
          status?: AnnouncementStatus
          image_url?: string | null
          external_url?: string | null
          pinned?: boolean
          published_date?: string | null
          created_at?: string
          updated_at?: string
          author_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_enroll_student: {
        Args: {
          p_student_id: string
        }
        Returns: number
      }
    }
    Enums: {
      user_role: UserRole
      course_level: CourseLevel
      notification_type: NotificationType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
