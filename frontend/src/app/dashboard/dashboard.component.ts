import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, interval, takeWhile } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  data: any[] = [];
  tableData: any[] = [];
  years: string[] = [];

  private alive = true; // Flag to keep the timer running
  private saveDataInterval$ = new Subject();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const username = localStorage.getItem("username")|| '';

    this.authService.getData(username)
    .subscribe({
      next: (response) => {
        this.data= response.data;
        this.extractYears();
        this.tableData = JSON.parse(JSON.stringify(this.data));
        this.tableData = this.processData(this.data);
      }, 
      error: (error) => {
        console.error(error);
        alert('Something went wrong!.');
      }
    });

    // Process data to create the table structure


    this.startSaveDataInterval();
  }

  extractYears() {
    const uniqueYears = new Set<string>(); // Explicitly specify string type
    this.data.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (!['Country', 'Gender', 'AgeGroup'].includes(key)) {
          uniqueYears.add(key as string); // Cast key to string
        }
      });
    });
    this.years = Array.from(uniqueYears);
  }

  ngOnDestroy() {
    // Unsubscribe from the save data interval when the component is destroyed
    this.alive = false;
    this.saveDataInterval$.next(true);
    this.saveDataInterval$.complete();
  }  

  startSaveDataInterval() {
    // Use interval from RxJS to trigger saveData every 5 seconds
    interval(5000)
      .pipe(takeWhile(() => this.alive))
      .subscribe(() => this.saveData());
  }
  
  copyData() {
    // Prompt the user for source and target years
    const sourceYearInput = prompt('Enter the source year:');
    const targetYearInput = prompt('Enter the target year:');

    // Validate input
    if (!sourceYearInput || !targetYearInput) {
      alert('Invalid input. Please enter both source and target years.');
      return;
    }

    const sourceYear = sourceYearInput.trim();
    const targetYear = targetYearInput.trim();

    // Validate if the source year exists
    if (!this.years.includes(sourceYear)) {
      alert('Invalid source year. Please enter a valid source year.');
      return;
    }

    // Create the target year if it doesn't exist
    if (!this.years.includes(targetYear)) {
      this.years.push(targetYear);
      this.data.forEach(item => {
        item[targetYear] = 0; // You may set an initial value or leave it as 0
      });
    }

    // Copy data from source year to target year
    this.data.forEach(item => {
      item[targetYear] = item[sourceYear];
    });

    // Update the tableData array to reflect the changes
    this.tableData = JSON.parse(JSON.stringify(this.data));
    this.tableData = this.processData(this.data);
  }

  addNewColumn() {
    // Prompt the user for the new column name and grand total
    const newColumnName = prompt('Enter the name of the new column:');
    const grandTotal = Number(prompt('Enter the grand total for the new column:'));
  
    if (newColumnName) {
      // Update the list of years
      this.years.push(newColumnName);
  
      // Calculate ratios for the specified year
      const ratios = this.calculateRatios(this.years[this.years.length - 2]); // Assuming the last year is the reference (2023)
  
      // Calculate new column values for Country 1 using the ratios and grand total
      const newColumnCountry1 = this.roundOff(grandTotal * ratios[0]);
      const newColumnTotalMale1 = this.roundOff(newColumnCountry1 * ratios[1]);
      const newColumnTotalFemale1 = this.roundOff(newColumnCountry1 * ratios[2]);
  
      // Distribute Total Male value into individual Male age groups based on 2023 ratios
      const newColumnMaleAgeGroupValues1 = this.calculateAgeGroupValues(newColumnTotalMale1, ratios[6]);
  
      // Distribute Total Female value into individual Female age groups based on 2023 ratios
      const newColumnFemaleAgeGroupValues1 = this.calculateAgeGroupValues(newColumnTotalFemale1, ratios[7]);
  
      // Calculate new column values for Country 2 using the ratios and grand total
      const newColumnCountry2 = this.roundOff(grandTotal * ratios[3]);
      const newColumnTotalMale2 = this.roundOff(newColumnCountry2 * ratios[4]);
      const newColumnTotalFemale2 = this.roundOff(newColumnCountry2 * ratios[5]);
  
      // Distribute Total Male value into individual Male age groups based on 2023 ratios
      const newColumnMaleAgeGroupValues2 = this.calculateAgeGroupValues(newColumnTotalMale2, ratios[8]);
  
      // Distribute Total Female value into individual Female age groups based on 2023 ratios
      const newColumnFemaleAgeGroupValues2 = this.calculateAgeGroupValues(newColumnTotalFemale2, ratios[9]);
  
      // Insert the new column values into the data array
      this.data.forEach(item => {
        if (item.Country === 'Country 1') {
          item[newColumnName] =
            item.Gender === 'Male'
              ? item.AgeGroup === 'Total'
                ? newColumnTotalMale1
                : newColumnMaleAgeGroupValues1[item.AgeGroup]
              : item.AgeGroup === 'Total'
              ? newColumnTotalFemale1
              : newColumnFemaleAgeGroupValues1[item.AgeGroup];
        } else if (item.Country === 'Country 2') {
          item[newColumnName] =
            item.Gender === 'Male'
              ? item.AgeGroup === 'Total'
                ? newColumnTotalMale2
                : newColumnMaleAgeGroupValues2[item.AgeGroup]
              : item.AgeGroup === 'Total'
              ? newColumnTotalFemale2
              : newColumnFemaleAgeGroupValues2[item.AgeGroup];
        }
      });
  
      // Update the tableData array to reflect the changes
      this.tableData = JSON.parse(JSON.stringify(this.data));
      this.tableData = this.processData(this.data);
    }
  }
  
  calculateAgeGroupValues(totalValue: number, ratios: { [key: string]: number }): { [key: string]: number } {
    const ageGroupValues: { [key: string]: number } = {};
    for (const [ageGroup, ratio] of Object.entries(ratios)) {
      ageGroupValues[ageGroup] = this.roundOff(totalValue * (ratio as number));
    }
    return ageGroupValues;
  }  
  
  roundOff(value: number): number {
    return Math.round(value);
  }

  calculateRatios(year: string): any[] {
    // Assuming this.data is your input data
    const country1Total = this.calculateCountryTotal(this.data, 'Country 1', year);
    const country2Total = this.calculateCountryTotal(this.data, 'Country 2', year);
    const country1MaleTotal = this.calculateGenderTotal(this.data, 'Male', 'Country 1', year);
    const country1FemaleTotal = this.calculateGenderTotal(this.data, 'Female', 'Country 1', year);
    const country2MaleTotal = this.calculateGenderTotal(this.data, 'Male', 'Country 2', year);
    const country2FemaleTotal = this.calculateGenderTotal(this.data, 'Female', 'Country 2', year);

    const grandTotal = this.data.reduce((total, item) => total + (item[year] || 0), 0);

    // Calculate ratios
    const country1TotalRatio = country1Total / grandTotal;
    const country1MaleRatio = country1MaleTotal / country1Total;
    const country1FemaleRatio = country1FemaleTotal / country1Total;
    const country2TotalRatio = country2Total / grandTotal;
    const country2MaleRatio = country2MaleTotal / country2Total;
    const country2FemaleRatio = country2FemaleTotal / country2Total;

    // Calculate ratios for individual gender age groups
    const country1MaleAgeGroupRatios = this.calculateAgeGroupRatios(this.data, 'Male', 'Country 1', year);
    const country1FemaleAgeGroupRatios = this.calculateAgeGroupRatios(this.data, 'Female', 'Country 1', year);

    const country2MaleAgeGroupRatios = this.calculateAgeGroupRatios(this.data, 'Male', 'Country 2', year);
    const country2FemaleAgeGroupRatios = this.calculateAgeGroupRatios(this.data, 'Female', 'Country 2', year);

    return [
      country1TotalRatio,
      country1MaleRatio,
      country1FemaleRatio,
      country2TotalRatio,
      country2MaleRatio,
      country2FemaleRatio,
      country1MaleAgeGroupRatios,
      country1FemaleAgeGroupRatios,
      country2MaleAgeGroupRatios,
      country2FemaleAgeGroupRatios
    ];
  }

  calculateAgeGroupRatios(data: any[], gender: string, country: string, year: string): { [key: string]: number } {
    const ageGroupRatios: { [key: string]: number } = {};
    const ageGroups = [...new Set(data.filter(item => item.Country === country && item.Gender === gender).map(item => item.AgeGroup))];

    ageGroups.forEach(ageGroup => {
      const ageGroupTotal = this.calculateAgeGroupTotal(data, gender, country, ageGroup, year);
      const genderTotal = this.calculateGenderTotal(data, gender, country, year);
      ageGroupRatios[ageGroup] = ageGroupTotal / genderTotal;
    });

    return ageGroupRatios;
  }


  calculateGenderTotal(data: any[], gender: string, country: string, year: string): number {
    return this.sumColumnValues(data.filter(item => item.Country === country && item.Gender === gender), year);
  }

  calculateAgeGroupTotal(data: any[], gender: string, country: string, ageGroup: string, year: string): number {
    return this.sumColumnValues(data.filter(item => item.Country === country && item.Gender === gender && item.AgeGroup === ageGroup), year);
  }

  calculateCountryTotal(data: any[], country: string, year: string): number {
    return this.sumColumnValues(data.filter(item => item.Country === country), year);
  }


  getYearList(): string[] {
    // Include the new columns dynamically
    return [...this.years];
  }

  trackByIndex(index: number, item: any) {
    return index;
  }

  onCellValueChange(row: any, year: string, newValue: number) {
    // Update the value in the original data
    const originalDataItem = this.data.find(item =>
      item.Country === row.Country && item.Gender === row.Gender && item.AgeGroup === row.AgeGroup
    );
    if (originalDataItem) {
      originalDataItem[year] = newValue;

      // If the change is in the Male Total column for Country 1, redistribute the values
      if (row.Country === 'Country 1' && row.Gender === 'Male' && row.AgeGroup === 'Total') {
        this.redistributeValuesForMaleTotalChange(originalDataItem, year, newValue);
      }
    }

    // Recalculate totals
    this.tableData = this.processData(this.data);
  }

  redistributeValuesForMaleTotalChange(originalDataItem: any, year: string, newTotalValue: number) {
    // Calculate ratios for the specified year
    const ratios = this.calculateRatios(this.years[this.years.length - 2]); // Assuming the last year is the reference (2023)

    // Recalculate Total Male value based on the new Total value
    const newColumnTotalMale1 = this.roundOff(newTotalValue * ratios[1]);

    // Distribute the new Total Male value into individual Male age groups based on 2023 ratios
    const newColumnMaleAgeGroupValues1 = this.calculateAgeGroupValues(newColumnTotalMale1, ratios[6]);

    // Update the values for each Male age group
    this.data.forEach(item => {
      if (item.Country === 'Country 1' && item.Gender === 'Male' && item.AgeGroup !== 'Total') {
        item[year] = newColumnMaleAgeGroupValues1[item.AgeGroup];
      }
    });

    // Recalculate the Grand Total
    const grandTotal = this.calculateGrandTotal(this.data);

    // Update the row representing Grand Total
    const grandTotalRow = this.tableData.find(item => item.Country === 'Grand Total');
    if (grandTotalRow) {
      grandTotalRow[year] = grandTotal;
    }
  }

  processData(data: any[]): any[] {
    const processedData: any[] = [];
    const uniqueCountries = [...new Set(data.map(item => item.Country))];
    const uniqueGenders = [...new Set(data.map(item => item.Gender))];
    const uniqueAgeGroups = [...new Set(data.map(item => item.AgeGroup))];

    uniqueCountries.forEach(country => {
      uniqueGenders.forEach(gender => {
        uniqueAgeGroups.forEach(ageGroup => {
          const filteredData = data.filter(
            item => item.Country === country && item.Gender === gender && item.AgeGroup === ageGroup
          );

          const isTotalRow = country.startsWith('Total') || gender.startsWith('Total');
          processedData.push({
            Country: country,
            Gender: gender,
            AgeGroup: ageGroup,
            isTotalRow: isTotalRow,
            ...this.createYearColumns(filteredData),
          });
        });

        // Calculate total for the specific gender and age group of a country
        const genderTotalData = processedData.filter(
          item => item.Gender === gender && item.Country === country && !item.isTotalRow
        );
        processedData.push({
          Country: `Total ${gender}`,
          Gender: '',
          AgeGroup: '',
          isTotalRow: true,
          ...this.createYearColumns(genderTotalData),
        });
      });

      // Calculate total for the specific country using a copy of the data
      const countryTotalData = processedData.filter(
        item => item.Country === country && !item.isTotalRow
      );
      processedData.push({
        Country: `Total ${country}`,
        Gender: '',
        AgeGroup: '',
        isTotalRow: true,
        ...this.createYearColumns(countryTotalData),
      });
    });

    // Calculate grand total
    const grandTotal = this.calculateGrandTotal(processedData);
    processedData.push({
      Country: 'Grand Total',
      Gender: '',
      AgeGroup: '',
      isTotalRow: true,
      ...this.createYearColumns(data),
      GrandTotal: grandTotal,
    });

    return processedData;
  }


  calculateGrandTotal(data: any[]): number {
    const grandTotalData = data.filter(item => item.Country.startsWith('Total'));
    return this.calculateColumnTotal(grandTotalData);
  }

  isTotalColumn(column: string): boolean {
    return this.tableData.some(row => row[column] !== undefined && row.isTotalRow);
  }

  calculateRowTotal(data: any[]): number {
    return data.reduce((total, item) => total + this.sumYearValues(item), 0);
  }

  calculateColumnTotal(data: any[]): number {
    
    return this.years.reduce((total, year) => total + this.sumColumnValues(data, year), 0);
  }

  sumYearValues(item: any): number {
    //const years = ['2019', '2020', '2021', '2022', '2023'];
    return this.years.reduce((total, year) => total + item[year], 0);
  }

  sumColumnValues(data: any[], column: string): number {
    return data.reduce((total, item) => total + item[column], 0);
  }

  createYearColumns(data: any[]): any {
    const yearColumns: { [key: string]: number } = {};

    // Loop through all years, including the new columns
    this.years.forEach(year => {
      yearColumns[year] = this.sumColumnValues(data, year);
    });

    return yearColumns;
  }

  deleteColumn() {
    // Prompt the user for the column name to delete
    const columnNameToDelete = prompt('Enter the name of the column to delete:');
  
    // Verify that the entered column name is valid
    if (!columnNameToDelete || !this.years.includes(columnNameToDelete)) {
      alert('Invalid column name. Please enter a valid column name.');
      return;
    }
  
    // Remove the specified column from the list of years
    this.years = this.years.filter(year => year !== columnNameToDelete);
  
    // Remove the column from the data array
    this.data.forEach(item => {
      delete item[columnNameToDelete];
    });
  
    // Update the tableData array to reflect the changes
    this.tableData = JSON.parse(JSON.stringify(this.data));
    this.tableData = this.processData(this.data);
  }
  
  saveData() {
    console.log('Modified Data:', this.data); 
    this.authService.saveData(this.data)
    .subscribe({
      next: (response) => {
        console.log(response);
      }, 
      error: (error) => {
        console.error(error);
        alert('Something went wrong!.');
      }
    });
  }
  
  logout(){
    this.authService.logout();
  }
}