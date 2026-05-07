// hooks/useDashboardData.ts
"use client";
import { useEffect, useState } from "react";
import { FilterState } from "../types";
import { mapApi } from "../services/api";

const serializeFilters = (filters?: FilterState) => {
  if (!filters) {
    return "__all__";
  }

  return JSON.stringify({
    ...filters,
    start_date:
      filters.start_date instanceof Date
        ? filters.start_date.toISOString()
        : filters.start_date,
    end_date:
      filters.end_date instanceof Date
        ? filters.end_date.toISOString()
        : filters.end_date,
    batch: filters.batch ?? null,
  });
};

export const useDashboardData = (filters?: FilterState) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterSignature = serializeFilters(filters);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // pass the filters (or undefined) to getDashboardData
        const result = await mapApi.getDashboardData(filters);
        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setError("Failed to fetch dashboard data");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [filterSignature]);

  return { data, isLoading, error };
};
