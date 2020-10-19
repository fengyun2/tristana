import Dashboard from './dashboard/store';

class Store {
    dashboardStore: Dashboard;

    constructor() {
        this.dashboardStore = new Dashboard();
    }
}
export default new Store();