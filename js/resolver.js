import axios from "axios";

const reportError = (func) => (dataPoint) => {
  try {
    return func(dataPoint);
  } catch (e) {
    throw new Error(`Error in project ${dataPoint.uuid}: ${e.message}`);
  }
};

const formatTimestamp = (dataPoint) => {
  if (!dataPoint.added_to_index) {
    throw new Error("No timestamp");
  }
  dataPoint["added_to_index_formatted"] = new Date(
    dataPoint["added_to_index"] * 1000
  ).toLocaleDateString("en-gb", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "utc",
  });
  return dataPoint;
};

const formatAuthorNames = (dataPoint) => {
  dataPoint.contributors = dataPoint.contributors.map((contributor) => {
    const names = contributor.name.split(",");
    const formatted_name = `${
      names[names.length - 1]
    } ${names[0][0].toUpperCase()}`;
    return {
      formatted_name,
      ...contributor,
    };
  });
  return dataPoint;
};

const hoistEga = (dataPoint) => {
  const egaStudiesPrefix = "https://ega-archive.org/studies/";
  const egaDatasetsPrefix = "https://ega-archive.org/datasets/";
  dataPoint["ega_studies_accessions"] = dataPoint["supplementary_links"]
    .filter((link) => link.includes(egaStudiesPrefix))
    .map((link) => link.replace(egaStudiesPrefix, ""));

  dataPoint["ega_datasets_accessions"] = dataPoint["supplementary_links"]
    .filter((link) => link.includes(egaDatasetsPrefix))
    .map((link) => link.replace(egaDatasetsPrefix, ""));

  return dataPoint;
};

const fetchData = (url = process.env.STATIC_DATA_URL) => {
  // Fetching from URL rather than using dynamic imports asc will eventually use ingest API
  return axios
    .get(url)
    .then((res) => res.data)
    .then(
      (data) =>
        data.map(
          ({ uuid, added_to_index, dcp_url, publications, content }) => ({
            uuid,
            added_to_index,
            dcp_url,
            publications,
            ...content,
          })
        ) // Flatten
    )
    .then((data) =>
      data.map(
        ({
          insdc_project_accessions,
          array_express_accessions,
          geo_series_accessions,
          supplementary_links,
          publications,
          ...rest
        }) => ({
          // These properties might be null but better treated as always arrays
          insdc_project_accessions: insdc_project_accessions || [],
          array_express_accessions: array_express_accessions || [],
          geo_series_accessions: geo_series_accessions || [],
          supplementary_links: supplementary_links || [],
          publications: publications || [],
          ...rest,
        })
      )
    )
    .then((data) => data.map(hoistEga))
    .then((data) =>
      data.map(reportError(formatTimestamp)).map(reportError(formatAuthorNames))
    )
    .then((data) =>
      data.sort((a, b) => (a.added_to_index <= b.added_to_index ? 1 : -1))
    );
};

module.exports = fetchData;
