export interface Feedback {
  id: string;
  original_text: string;
  cleaned_text?: string;
  sentiment: 'positive' | 'neutral' | 'negative' | string;
  sentiment_score: number;
  priority: 'critical' | 'high' | 'moderate' | 'low' | string;
  source_name?: string;
  cluster_id?: string;
  cluster_title?: string;
  is_demo_data: boolean;
  is_irrelevant: boolean;
  feedback_date: string;
  created_at: string;
}

export interface FeedbackListResponse {
  items: Feedback[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RepresentativeFeedback {
  text: string;
  similarity: number;
}

export interface ClusterMember {
  id: string;
  feedback_id: string;
  text: string;
  sentiment: string;
  priority: string;
  feedback_date: string;
  similarity_score: number;
}

export interface IssueCluster {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  primary_category: string;
  secondary_category?: string;
  status: string;
  feedback_count: number;
  avg_sentiment_score: number;
  priority: 'critical' | 'high' | 'moderate' | 'low' | string;
  keywords: string[];
  representative_feedback: RepresentativeFeedback[];
  created_at: string;
  updated_at: string;
}

export interface IssueClusterDetail extends IssueCluster {
  members: ClusterMember[];
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
}

export interface PriorityDistribution {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export interface TrendPoint {
  date: string;
  count: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface KeyInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
}

export interface OverviewStats {
  total_feedback: number;
  total_issues: number;
  high_priority_issues: number;
  avg_sentiment_score: number;
  sentiment_distribution: SentimentDistribution;
  priority_distribution: PriorityDistribution;
  top_categories: CategoryCount[];
  trends: TrendPoint[];
  key_insights: KeyInsight[];
}
