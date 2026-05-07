"use client"
import { useEffect, useState, FormEvent } from "react";
import Select, {
  type GroupBase,
  type MultiValue,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import type { FilterState, ExpertBatch } from "../../../types";
import { mapApi } from "../../../services/api";

// Define option type for Select components
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

interface MultiSelectFormProps {
  onSubmitFilterState?: (filterState: FilterState) => void;
  apiFilterOptions?: string;
  initialFilterState?: FilterState | null;
  onError: (message: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ALL_UPLOADS_OPTION: SelectOption = { value: "", label: "All uploads" };

const selectStyles: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> = {
  container: (base) => ({
    ...base,
    minWidth: 0,
    width: "100%",
  }),
  control: (base, state) => ({
    ...base,
    minHeight: "2.5rem",
    minWidth: 0,
    width: "100%",
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
    zIndex: 9999,
  }),
  valueContainer: (base) => ({
    ...base,
    minWidth: 0,
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

const createBatchSelectOptions = (batches: ExpertBatch[]) => {
  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: batch.filename || batch.id,
  }));

  return [ALL_UPLOADS_OPTION, ...batchOptions];
};

const findLocation = (location: string, provinces: SelectOption[], cities: SelectOption[]): SelectOption => {
  const province = provinces.find((opt: SelectOption) => opt.value === location);
  if (province) return province;

  const city = cities.find((opt: SelectOption) => opt.value === location);
  return city ?? { value: location, label: location };
};

// Main function to set selected locations
const getSelectedLocations = (
  locations: string[],
  provinces: SelectOption[],
  cities: SelectOption[]
): SelectOption[] => {
  return locations.map(location => findLocation(location, provinces, cities));
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

export default function MultiSelectForm({
  apiFilterOptions = `${API_BASE_URL}/api/filters/`, 
  onSubmitFilterState, 
  initialFilterState,
  onError
}: MultiSelectFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDiseases, setSelectedDiseases] = useState<SelectOption[]>([]);
  const [selectedNews, setSelectedNews] = useState<SelectOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectOption[]>([]);
  const [selectedLevelOfAlertness, setSelectedLevelOfAlertness] = useState(0);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [batchOptions, setBatchOptions] = useState<SelectOption[]>([ALL_UPLOADS_OPTION]);
  const [selectedBatch, setSelectedBatch] = useState<SelectOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    diseases: [],
    locations: {
      provinces: [],
      cities: []
    },
    news: [],
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Preselect batch if provided so mocked selects pick it up even before options arrive
  useEffect(() => {
    if (initialFilterState?.batch) {
      setSelectedBatch({
        value: initialFilterState.batch,
        label: initialFilterState.batch,
      });
    }
  }, [initialFilterState?.batch]);
  
  const handleReset = () => {
    setSelectedDiseases([]);
    setSelectedNews([]);
    setSelectedLocations([]);
    setSelectedLevelOfAlertness(0);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectedBatch(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const filterState: FilterState = {
      diseases: selectedDiseases.map((disease) => disease.value),
      locations: selectedLocations.map((location) => location.value),
      portals: selectedNews.map((news) => news.value),
      level_of_alertness: selectedLevelOfAlertness,
      start_date: selectedStartDate,
      end_date: selectedEndDate,
      batch: selectedBatch && selectedBatch.value !== "" ? selectedBatch.value : null
    };

    try {
      if (onSubmitFilterState) {
        onSubmitFilterState(filterState);
      }
    } catch (error) {
      console.error(error);
      onError(
        error instanceof Error
          ? error.message
          : "Failed to load the map. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function fetchFilters() {
      setIsLoadingFilters(true);
      try {
        const [responseFilters, batches] = await Promise.all([
          mapApi.getFilterOptions(),
          mapApi.getExpertBatches(),
        ]);
        if (!isActive) return;

        setFilterOptions({
          diseases: dedupeOptions([
            { value: "all", label: "Pilih Semua" },
            ...responseFilters.data.diseases,
          ]),
          locations: {
            provinces: dedupeOptions(
              responseFilters.data.locations.provinces.map((item: SelectOption) => ({
                ...item,
                scope: "province" as const,
              }))
            ),
            cities: dedupeOptions(
              responseFilters.data.locations.cities.map((item: SelectOption) => ({
                ...item,
                scope: "city" as const,
              }))
            ),
          },
          news: dedupeOptions([
            { value: "all", label: "Pilih Semua" },
            ...responseFilters.data.news,
          ]),
        });
        setBatchOptions(createBatchSelectOptions(batches));
      } catch (error) {
        const msg =
          error instanceof Error && error.message
            ? error.message
            : "Failed to fetch filter options";
        console.error(msg);
        if (isActive) {
          onError(msg);
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

    setSelectedDiseases(
      initialFilterState.diseases.map((disease) =>
        filterOptions.diseases.find((option) => option.value === disease) || {
          value: disease,
          label: disease,
        }
      )
    );

    setSelectedLocations(
      getSelectedLocations(
        initialFilterState.locations,
        filterOptions.locations.provinces,
        filterOptions.locations.cities
      )
    );

    setSelectedNews(
      initialFilterState.portals.map((portal) =>
        filterOptions.news.find((option) => option.value === portal) || {
          value: portal,
          label: portal,
        }
      )
    );

    setSelectedLevelOfAlertness(initialFilterState.level_of_alertness || 0);
    setSelectedStartDate(
      initialFilterState.start_date ? new Date(initialFilterState.start_date) : null
    );
    setSelectedEndDate(
      initialFilterState.end_date ? new Date(initialFilterState.end_date) : null
    );

    if (initialFilterState.batch) {
      const matchingBatch = batchOptions.find(
        (option) => option.value === initialFilterState.batch
      );
      setSelectedBatch(
        matchingBatch || {
          value: initialFilterState.batch,
          label: initialFilterState.batch,
        }
      );
    } else if (initialFilterState.batch === null) {
      setSelectedBatch(null);
    }
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

  if (isLoadingFilters) {
    return (
      <div className="w-full p-2">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading filter options...</p>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="w-full p-2">
        <div className="space-y-4">
          <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
          <div className="h-16 rounded-md bg-gray-100 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
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
    <div className="w-full min-w-0">
      <form data-testid="map-filter-select" onSubmit={handleSubmit} className="min-w-0 space-y-4">
        {/* diseases */}
        <div>
          <label htmlFor="map-disease-select" className="block text-sm font-medium">
            Jenis Penyakit
          </label>
          <Select<SelectOption, true>
            inputId="map-disease-select"
            instanceId="map-disease-select"
            isMulti
            closeMenuOnSelect={false}
            options={diseaseOptions}
            value={selectedDiseases}
            onChange={handleDiseaseChange}
            getOptionValue={getSelectOptionValue}
            placeholder="Pilih penyakit"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1 w-full min-w-0"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>
        {/* locations */}
        <div>
          <label htmlFor="map-location-select" className="block text-sm font-medium">
            Lokasi
          </label>
          <Select<SelectOption, true, GroupBase<SelectOption>>
            inputId="map-location-select"
            instanceId="map-location-select"
            isMulti
            closeMenuOnSelect={false}
            options={locationOptions}
            value={selectedLocations}
            onChange={handleLocationChange}
            getOptionValue={getSelectOptionValue}
            placeholder="Pilih lokasi"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1 w-full min-w-0"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>
        {/* news */}
        <div>
          <label htmlFor="map-news-select" className="block text-sm font-medium">
            Sumber Berita
          </label>
          <Select<SelectOption, true>
            inputId="map-news-select"
            instanceId="map-news-select"
            isMulti
            closeMenuOnSelect={false}
            options={newsOptions}
            value={selectedNews}
            onChange={handleNewsChange}
            getOptionValue={getSelectOptionValue}
            placeholder="Pilih sumber"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1 w-full min-w-0"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>
        {/* csv batches */}
        <div>
          <label htmlFor="map-batch-select" className="block text-sm font-medium">
            CSV Upload
          </label>
          <Select<SelectOption, false>
            inputId="map-batch-select"
            instanceId="map-batch-select"
            isClearable
            options={batchOptions}
            value={selectedBatch}
            onChange={handleBatchChange}
            getOptionValue={getSelectOptionValue}
            placeholder="All uploads"
            noOptionsMessage={() => "Tidak ada pilihan"}
            className="mt-1 w-full min-w-0"
            styles={selectStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
          />
        </div>
        {/* level of alertness */}
        <div>
          <span className="block text-sm font-medium mb-1">Tingkat Kewaspadaan:</span>
          <div className="flex flex-col gap-2 rounded-md border border-gray-300 p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-gray-500">Atur tingkat Kewaspadaan:</span>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-3xl transition-all ${
                    star <= selectedLevelOfAlertness ? "text-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setSelectedLevelOfAlertness(star)}
                >
                  {star <= selectedLevelOfAlertness ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* date range */}
        <div>
          <span className="block text-sm font-medium mb-1">Tanggal</span>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
            <input
              type="date"
              value={formatDateForInput(selectedStartDate)}
              onChange={(event) => setSelectedStartDate(parseDateInput(event.target.value))}
              max={selectedEndDate ? formatDateForInput(selectedEndDate) : undefined}
              className="border p-2 rounded-md w-full"
            />
            <span className="hidden text-gray-400 sm:inline">-</span>
            <input
              type="date"
              value={formatDateForInput(selectedEndDate)}
              onChange={(event) => setSelectedEndDate(parseDateInput(event.target.value))}
              min={selectedStartDate ? formatDateForInput(selectedStartDate) : undefined}
              className="border p-2 rounded-md w-full"
            />
          </div>
        </div>
        {/* submit */}
        <div className="flex flex-col-reverse gap-2 text-sm sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-md border px-4 py-2 text-gray-600 hover:bg-gray-100 sm:w-auto sm:min-w-28"
          >
            Reset
          </button>
          <button
            type="submit"
            data-testid="submit-button-form-filter"
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-32"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Data"}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { FilterState };
