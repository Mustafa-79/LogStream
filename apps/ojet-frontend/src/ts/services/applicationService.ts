import ApiLinks from "../network/apiLinks";

class ApplicationService {
  static async fetchAllApplications() {
    const response = await fetch(ApiLinks.GET_ALL_APPLICATIONS);
    const json = await response.json();
    return json;
  }
}

export default ApplicationService;
