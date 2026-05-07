"use client";

import React, { useEffect, useState, FormEvent } from "react";
import Select, {
  type GroupBase,
  type MultiValue,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import type { FilterStateDashboard, ExpertBatch } from "../../../types";
import { mapApi } from "../../../services/api";
import { API_BASE } from "../../../config";

interface SelectOption {
  value: string;
  label: string;
  scope?: "province" | "city";
}

interface FilterOptions {
  diseases: SelectOption[];
  locations: {
    provinces: SelectOption[];
    cities: SelectOption[];
  };
  news: SelectOption[];
}

interface FilterOptionsResponse {
  data: FilterOptions;
}

interface MultiSelectFormProps {
  onSubmitFilterState?: (filterState: FilterStateDashboard) => void;
  apiFilterOptions?: string;
  initialFilterState?: FilterStateDashboard | null;
  onError: (message: string) => void;
}

const API_BASE_URL = API_BASE;
const ALL_UPLOADS_OPTION: SelectOption = { value: "", label: "All uploads" };

const selectStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    minHeight: "2.5rem",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    borderRadius: "0.375rem",
    boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
    fontSize: "0.875rem",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.375rem",
    overflow: "hidden",
    zIndex: 50,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "#f3f4f6"
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#111827",
    fontSize: "0.875rem",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#f3f4f6",
    borderRadius: "0.375rem",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#374151",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#4b5563",
    ":hover": {
      backgroundColor: "#3b82f6",
      color: "#ffffff",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "#e5e7eb",
  }),
};

const createSelectOptions = (items: SelectOption[], allOption = true) => {
  const baseOptions: SelectOption[] = allOption
    ? [{ value: "all", label: "Pilih Semua" }]
    : [];
  return [...baseOptions, ...items];
};

const dedupeOptions = (options: SelectOption[]) => {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = `${option.scope ?? "default"}:${option.value}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getVisibleOptions = (options: SelectOption[]) =>
  options.filter((option) => option.value !== "all");

const getSelectOptionValue = (option: SelectOption) =>
  `${option.scope ?? "default"}:${option.value}`;

const formatDateForInput = (value: Date | null) => {
  if (!value) return "";
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const createBatchSelectOptions = (batches: ExpertBatch[]): SelectOption[] => {
  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: batch.filename || batch.id,
  }));

  return [ALL_UPLOADS_OPTION, ...batchOptions];
};

const LoadingPlaceholder = ({ label }: { label?: string }) => (
  <div>
    {label && <span className="block text-sm font-medium mb-1">{label}</span>}
    <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
  </div>
);

const LoadingForm = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-md">
    <div className="bg-blue-500 px-6 py-4">
      <h2 className="text-white text-lg font-semibold">Filter Informasi Penyakit Menular</h2>
    </div>
    <div className="p-6 space-y-4">
      <LoadingPlaceholder label="Jenis Penyakit" />
      <LoadingPlaceholder label="Lokasi" />
      <LoadingPlaceholder label="Sumber Berita" />
      <LoadingPlaceholder label="CSV Upload" />
      <LoadingPlaceholder label="Tingkat Kewaspadaan" />
      <LoadingPlaceholder label="Tanggal" />
    </div>
  </div>
);

const AlertLevelField = ({
  level,
  onChange
}: {
  level: number;
  onChange: (level: number) => void;
}) => (
  <div>
    <span className="block text-sm font-medium mb-1">Tingkat Kewaspadaan:</span>
    <div className="border border-gray-300 text-sm rounded-md pb-1 pr-3 flex items-center justify-between shadow-sm mb-4">
      <span className="text-gray-400 pl-3">Atur tingkat Kewaspadaan:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-3xl transition-all ${
              star <= level ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => onChange(star)}
          >
            {star <= level ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const handleError = (error: unknown, onError: (message: string) => void) => {
  console.error(error);
  onError(
    error instanceof Error
      ? error.message
      : "Failed to load the map. Please try again."
  );
};

const createFilterState = (
  selectedDiseases: SelectOption[],
  selectedLocations: SelectOption[],
  selectedNews: SelectOption[],
  selectedLevelOfAlertness: number,
  selectedStartDate: Date | null,
  selectedEndDate: Date | null,
  selectedBatch: SelectOption | null
): FilterStateDashboard => {
  // Separate locations into provinces and cities
  const provinces: string[] = [];
  const cities: string[] = [];

  selectedLocations.forEach(location => {
    if (location.scope === "province") {
      provinces.push(location.value);
    } else if (location.scope === "city") {
      cities.push(location.value);
    }
  });

  return {
    diseases: selectedDiseases.map((disease) => disease.value),
    locations: {
      provinces,
      cities
    },
    portals: selectedNews.map((news) => news.value),
    level_of_alertness: selectedLevelOfAlertness,
    start_date: selectedStartDate,
    end_date: selectedEndDate,
    batch: selectedBatch && selectedBatch.value !== "" ? selectedBatch.value : null,
  };
};

const createFilterOptions = (responseFilters: FilterOptionsResponse): FilterOptions => ({
  diseases: dedupeOptions(createSelectOptions(responseFilters.data.diseases)),
  locations: {
    provinces: dedupeOptions(createSelectOptions(
      responseFilters.data.locations.provinces.map((item: SelectOption) => ({
        ...item,
        scope: "province" as const,
      }))
    )),
    cities: dedupeOptions(createSelectOptions(
      responseFilters.data.locations.cities.map((item: SelectOption) => ({
        ...item,
        scope: "city" as const,
      }))
    ))
  },
  news: dedupeOptions(createSelectOptions(responseFilters.data.news)),
});

const setInitialFilterValues = (
  initialFilterState: FilterStateDashboard,
  options: FilterOptions,
  setters: {
    setDiseases: (value: SelectOption[]) => void;
    setLocations: (value: SelectOption[]) => void;
    setNews: (value: SelectOption[]) => void;
    setLevelOfAlertness: (value: number) => void;
    setStartDate: (value: Date | null) => void;
    setEndDate: (value: Date | null) => void;
    setBatch: (value: SelectOption | null) => void;
  },
  batchOptions: SelectOption[]
) => {
  const setInitialValues = (
    items: string[],
    options: SelectOption[],
    setter: (value: SelectOption[]) => void
  ) => {
    setter(
      items.map(item => 
        options.find(option => option.value === item) || 
        { value: item, label: item }
      )
    );
  };

  setInitialValues(initialFilterState.diseases, options.diseases, setters.setDiseases);
  
  // Handle locations from both provinces and cities
  const locationOptions: SelectOption[] = [];
  
  // Add provinces
  initialFilterState.locations.provinces.forEach(province => {
    const option = options.locations.provinces.find(opt => opt.value === province);
    if (option) {
      locationOptions.push(option);
    }
  });
  
  // Add cities
  initialFilterState.locations.cities.forEach(city => {
    const option = options.locations.cities.find(opt => opt.value === city);
    if (option) {
      locationOptions.push(option);
    }
  });
  
  setters.setLocations(locationOptions);
  
  setInitialValues(initialFilterState.portals, options.news, setters.setNews);
  
  setters.setLevelOfAlertness(initialFilterState.level_of_alertness || 0);
  setters.setStartDate(initialFilterState.start_date ? new Date(initialFilterState.start_date) : null);
  setters.setEndDate(initialFilterState.end_date ? new Date(initialFilterState.end_date) : null);

  if (initialFilterState.batch) {
    const batchOption = batchOptions.find(opt => opt.value === initialFilterState.batch);
    if (batchOption) {
      setters.setBatch(batchOption);
    } else {
      setters.setBatch({
        value: initialFilterState.batch,
        label: initialFilterState.batch,
      });
    }
  } else if (initialFilterState.batch === null) {
    setters.setBatch(null);
  }
};

const FilterForm = ({
  apiFilterOptions = `${API_BASE_URL}/api/filters/`,
  onSubmitFilterState,
  initialFilterState,
  onError,
}: MultiSelectFormProps) => {
  const [selectedDiseases, setSelectedDiseases] = useState<SelectOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectOption[]>([]);
  const [selectedNews, setSelectedNews] = useState<SelectOption[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedLevelOfAlertness, setSelectedLevelOfAlertness] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    diseases: [],
    locations: {
      provinces: [],
      cities: [],
    },
    news: [],
  });
  const [batchOptions, setBatchOptions] = useState<SelectOption[]>([ALL_UPLOADS_OPTION]);
  const [selectedBatch, setSelectedBatch] = useState<SelectOption | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchFilters() {
      setIsLoadingFilters(true);
      try {
        const [responseFilters, batches] = await Promise.all([
          mapApi.getFilterOptions(),
          mapApi.getExpertBatches(),
        ]);
        if (!isActive) {
          return;
        }

        setFilterOptions(createFilterOptions(responseFilters));
        setBatchOptions(createBatchSelectOptions(batches));
      } catch (error) {
        if (isActive) {
          handleError(error, onError);
        }
      } finally {
        if (isActive) {
          setIsLoadingFilters(false);
        }
      }
    }

    fetchFilters();

    return () => {
      isActive = false;
    };
  }, [apiFilterOptions, onError]);

  useEffect(() => {
    const hasOptions =
      filterOptions.diseases.length > 0 ||
      filterOptions.locations.provinces.length > 0 ||
      filterOptions.locations.cities.length > 0 ||
      filterOptions.news.length > 0;

    if (!hasOptions) {
      return;
    }

    if (!initialFilterState) {
      setSelectedDiseases([]);
      setSelectedLocations([]);
      setSelectedNews([]);
      setSelectedLevelOfAlertness(0);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setSelectedBatch(null);
      return;
    }

    if (
      initialFilterState.batch &&
      !batchOptions.some((option) => option.value === initialFilterState.batch)
    ) {
      setBatchOptions((prev) => [
        ...prev,
        { value: initialFilterState.batch!, label: initialFilterState.batch! },
      ]);
      return;
    }

    setInitialFilterValues(
      initialFilterState,
      filterOptions,
      {
        setDiseases: setSelectedDiseases,
        setLocations: setSelectedLocations,
        setNews: setSelectedNews,
        setLevelOfAlertness: setSelectedLevelOfAlertness,
        setStartDate: setSelectedStartDate,
        setEndDate: setSelectedEndDate,
        setBatch: setSelectedBatch,
      },
      batchOptions
    );
  }, [batchOptions, filterOptions, initialFilterState]);

  const handleDiseaseChange = (options: MultiValue<SelectOption>) => {
    setSelectedDiseases([...options]);
  };

  const handleLocationChange = (options: MultiValue<SelectOption>) => {
    setSelectedLocations([...options]);
  };

  const handleNewsChange = (options: MultiValue<SelectOption>) => {
    setSelectedNews([...options]);
  };

  const handleBatchChange = (option: SingleValue<SelectOption>) => {
    setSelectedBatch(option ?? null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const filterState: FilterStateDashboard = createFilterState(
        selectedDiseases,
        selectedLocations,
        selectedNews,
        selectedLevelOfAlertness,
        selectedStartDate,
        selectedEndDate,
        selectedBatch
      );

      console.log("Submitting filter state:", filterState);

      if (onSubmitFilterState) {
        onSubmitFilterState(filterState);
      }
    } catch (error) {
      console.error("Error submitting filter:", error);
      onError("Failed to apply filter. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedDiseases([]);
    setSelectedLocations([]);
    setSelectedNews([]);
    setSelectedLevelOfAlertness(0);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectedBatch(null);
  };

  if (!isMounted) {
    return <LoadingForm />;
  }

  if (isLoadingFilters) {
    return <LoadingForm />;
  }

  const menuPortalTarget = typeof document !== "undefined" ? document.body : undefined;
  const diseaseOptions = getVisibleOptions(filterOptions.diseases);
  const locationOptions: GroupBase<SelectOption>[] = [
    {
      label: "Provinsi",
      options: getVisibleOptions(filterOptions.locations.provinces),
    },
    {
      label: "Kota/Kabupaten",
      options: getVisibleOptions(filterOptions.locations.cities),
    },
  ].filter((group) => group.options.length > 0);
  const newsOptions = getVisibleOptions(filterOptions.news);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-md">
      <div className="bg-blue-500 px-6 py-4">
        <h2 className="text-white text-lg font-semibold">Filter Informasi Penyakit Menular</h2>
      </div>
      <form data-testid="map-filter-select" onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label htmlFor="dashboard-disease-select" className="block text-sm font-medium">
            Jenis Penyakit
          </label>
          <Select<SelectOption, true>
            inputId="dashboard-disease-select"
            instanceId="dashboard-disease-select"
            isMulti
            closeMenuOnSelect={false}
            options={diseaseOptions}
            value={selectedDiseases}
            onChange={handleDiseaseChange}
            getOptionValue={getSelectOptionValue}
            placeholder="Pilih penyakit"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>

        <div>
          <label htmlFor="dashboard-location-select" className="block text-sm font-medium">
            Lokasi
          </label>
          <Select<SelectOption, true, GroupBase<SelectOption>>
            inputId="dashboard-location-select"
            instanceId="dashboard-location-select"
            isMulti
            closeMenuOnSelect={false}
            options={locationOptions}
            value={selectedLocations}
            onChange={handleLocationChange}
            getOptionValue={getSelectOptionValue}
            placeholder="Pilih lokasi"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>

        <div>
          <label htmlFor="dashboard-news-select" className="block text-sm font-medium">
            Sumber Berita
          </label>
          <Select<SelectOption, true>
            inputId="dashboard-news-select"
            instanceId="dashboard-news-select"
            isMulti
            closeMenuOnSelect={false}
            options={newsOptions}
            value={selectedNews}
            onChange={handleNewsChange}
            getOptionValue={getSelectOptionValue}
            placeholder="Pilih sumber"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>

        <div>
          <label htmlFor="dashboard-batch-select" className="block text-sm font-medium">
            CSV Upload
          </label>
          <Select<SelectOption, false>
            inputId="dashboard-batch-select"
            instanceId="dashboard-batch-select"
            isClearable
            options={batchOptions}
            value={selectedBatch}
            onChange={handleBatchChange}
            getOptionValue={getSelectOptionValue}
            placeholder="All uploads"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>

        <AlertLevelField
          level={selectedLevelOfAlertness}
          onChange={setSelectedLevelOfAlertness}
        />

        <div>
          <span className="block text-sm font-medium mb-1">Tanggal</span>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={formatDateForInput(selectedStartDate)}
              onChange={(event) => setSelectedStartDate(parseDateInput(event.target.value))}
              max={selectedEndDate ? formatDateForInput(selectedEndDate) : undefined}
              className="border p-2 rounded-md w-full"
            />
            <span>-</span>
            <input
              type="date"
              value={formatDateForInput(selectedEndDate)}
              onChange={(event) => setSelectedEndDate(parseDateInput(event.target.value))}
              min={selectedStartDate ? formatDateForInput(selectedStartDate) : undefined}
              className="border p-2 rounded-md w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 text-sm">  
          <button
            type="button"
            onClick={handleReset}
            className="w-1/4 border rounded-md text-gray-600 hover:bg-gray-100 py-2"
          >
            Reset
          </button>
          <button
            type="submit"
            data-testid="submit-button-form-filter"
            className="w-1/4 bg-blue-500 text-white py-2 rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim..." : "Terapkan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterForm; 
