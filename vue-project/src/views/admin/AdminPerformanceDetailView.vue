<template>
  <div class="performance-detail-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">
        {{ fixedStatisticsType === 'company' ? '업체별 통계' : 
           fixedStatisticsType === 'hospital' ? '병원별 통계' : 
           fixedStatisticsType === 'product' ? '제품별 통계' : '실적 상세 현황' }}
      </div>
    </div>

    <!-- 필터 카드: 정산월, 통계 타입, 드릴다운 필터 -->
    <div class="filter-card" style="flex-shrink: 0;">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>정산월</label>
          <select v-model="selectedSettlementMonth" class="select_month" @change="onSettlementMonthChange">
            <option value="">전체</option>
            <option v-for="month in availableMonths" :key="month.settlement_month" :value="month.settlement_month">
              {{ month.settlement_month }}
            </option>
          </select>
        </div>
        
        <div v-if="!fixedStatisticsType" style="display: flex; align-items: center; gap: 8px;">
          <label>통계 타입</label>
          <select v-model="statisticsType" class="select_month" @change="onStatisticsTypeChange">
            <option value="company">업체별</option>
            <option value="hospital">병원별</option>
            <option value="product">제품별</option>
          </select>
        </div>

        <!-- 업체별 통계일 때 -->
        <template v-if="statisticsType === 'company'">
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>통계</label>
            <select v-model="companyStatisticsFilter" class="select_month" @change="onCompanyStatisticsFilterChange">
              <option value="all">전체</option>
              <option value="hospital">병의원별</option>
              <option value="product">제품별</option>
            </select>
          </div>
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>구분</label>
            <select v-model="selectedCompanyGroup" class="select_month" @change="onCompanyGroupChange">
              <option value="">전체</option>
              <option
                v-for="group in availableCompanyGroups"
                :key="group"
                :value="group"
              >
                {{ group }}
              </option>
            </select>
          </div>
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>업체</label>
            <div class="company-search-container" style="position: relative;">
              <input
                v-model="companySearchText"
                @input="handleCompanySearch"
                @focus="handleCompanyFocus"
                @blur="delayedHideCompanyDropdown"
                @keydown="handleCompanyKeydown"
                placeholder="업체명을 입력하세요..."
                class="select_200px"
                autocomplete="off"
              />
              <div v-if="showCompanyDropdown && filteredCompanies.length > 0" class="company-dropdown">
                <div
                  :class="['company-dropdown-item', { 
                    selected: selectedCompanyId === '', 
                    highlighted: companyHighlightedIndex === 0 
                  }]"
                  @mousedown.prevent="selectCompany({ id: '', company_name: '전체' })"
                >
                  전체
                </div>
                <div
                  v-for="(company, index) in filteredCompanies"
                  :key="company.id"
                  :class="['company-dropdown-item', { 
                    selected: selectedCompanyId === company.id,
                    highlighted: companyHighlightedIndex === index + 1
                  }]"
                  @mousedown.prevent="selectCompany(company)"
                >
                  {{ company.company_name }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="drillDownLevel > 0" style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-back" @click="goBack">← 뒤로</button>
            <span style="font-weight: 500;">{{ currentDrillDownLabel }}</span>
          </div>
        </template>

        <!-- 병원별 통계일 때 -->
        <template v-if="statisticsType === 'hospital'">
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>통계</label>
            <select v-model="hospitalStatisticsFilter" class="select_month" @change="onHospitalStatisticsFilterChange">
              <option value="all">전체</option>
              <option value="product">제품별</option>
            </select>
          </div>
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>병의원</label>
            <div class="hospital-search-container" style="position: relative;">
              <input
                v-model="hospitalSearchText"
                @input="handleHospitalSearch"
                @focus="handleHospitalFocus"
                @blur="delayedHideHospitalDropdown"
                @keydown="handleHospitalKeydown"
                placeholder="병의원명을 입력하세요..."
                class="select_240px"
                autocomplete="off"
              />
              <div v-if="showHospitalDropdown && filteredHospitals.length > 0" class="hospital-dropdown">
                <div
                  :class="['hospital-dropdown-item', { 
                    selected: selectedHospitalId === '', 
                    highlighted: hospitalHighlightedIndex === 0 
                  }]"
                  @mousedown.prevent="selectHospital({ id: '', name: '전체' })"
                >
                  전체
                </div>
                <div
                  v-for="(hospital, index) in filteredHospitals"
                  :key="hospital.id"
                  :class="['hospital-dropdown-item', { 
                    selected: selectedHospitalId === hospital.id,
                    highlighted: hospitalHighlightedIndex === index + 1
                  }]"
                  @mousedown.prevent="selectHospital(hospital)"
                >
                  {{ hospital.name }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="drillDownLevel > 0" style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-back" @click="goBack">← 뒤로</button>
            <span style="font-weight: 500;">{{ currentDrillDownLabel }}</span>
          </div>
        </template>

        <!-- 제품별 통계일 때 -->
        <template v-if="statisticsType === 'product'">
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>통계</label>
            <select v-model="productStatisticsFilter" class="select_month" @change="onProductStatisticsFilterChange">
              <option value="all">전체</option>
              <option value="company">업체별</option>
              <option value="hospital">병의원별</option>
            </select>
          </div>
          <div v-if="drillDownLevel === 0" style="display: flex; align-items: center; gap: 8px;">
            <label>제품</label>
            <div class="product-search-container" style="position: relative;">
              <input
                v-model="productSearchText"
                @input="handleProductSearch"
                @focus="handleProductFocus"
                @blur="delayedHideProductDropdown"
                @keydown="handleProductKeydown"
                placeholder="제품명을 입력하세요..."
                class="select_240px"
                autocomplete="off"
              />
              <div v-if="showProductDropdown && filteredProducts.length > 0" class="product-dropdown">
                <div
                  :class="['product-dropdown-item', { 
                    selected: selectedProductId === '', 
                    highlighted: productHighlightedIndex === 0 
                  }]"
                  @mousedown.prevent="selectProduct({ id: '', product_name: '전체' })"
                >
                  전체
                </div>
                <div
                  v-for="(product, index) in filteredProducts"
                  :key="product.id"
                  :class="['product-dropdown-item', { 
                    selected: selectedProductId === product.id,
                    highlighted: productHighlightedIndex === index + 1
                  }]"
                  @mousedown.prevent="selectProduct(product)"
                >
                  {{ product.product_name }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="drillDownLevel > 0" style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-back" @click="goBack">← 뒤로</button>
            <span style="font-weight: 500;">{{ currentDrillDownLabel }}</span>
          </div>
        </template>

      </div>
    </div>

    <!-- 데이터 카드: 통계 테이블 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div class="data-card-header" style="flex-shrink: 0;">
        <div class="total-count-display">전체 {{ displayRows.length }} 건</div>
        <div class="data-card-buttons">
          <button 
            class="btn-excell-download" 
            @click="calculateStatistics" 
            :disabled="!selectedSettlementMonth || calculatingStatistics"
            style="margin-right: 8px;"
          >
            {{ calculatingStatistics ? '통계 계산 중...' : '통계 갱신' }}
          </button>
          <button class="btn-excell-download" @click="downloadExcel" :disabled="displayRows.length === 0">
            엑셀 다운로드
          </button>
        </div>
      </div>
      <div style="flex-grow: 1; overflow: hidden;">
        <DataTable 
          :value="displayRows" 
          :loading="loading"
          scrollable 
          scrollHeight="calc(100vh - 280px)"
          scrollDirection="both"
          class="admin-performance-detail-table"
          :paginator="true"
          :rows="100"
          :rowsPerPageOptions="[100, 200, 500, 1000]"
          @page="onPageChange"
        >
          <template #empty>
            <div v-if="!loading">데이터가 없습니다.</div>
          </template>
          
          <!-- 업체별 통계 테이블 -->
          <template v-if="statisticsType === 'company' && drillDownLevel === 0">
            <Column header="No" :headerStyle="{ width: '4%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="company_group" header="구분" :headerStyle="{ width: '6%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.data.company_group || '-' }}
              </template>
            </Column>
            <Column field="company_name" header="업체명" :headerStyle="{ width: companyStatisticsFilter === 'all' ? '15%' : '12%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.company_name }}
              </template>
            </Column>
            <!-- 병의원별 필터일 때 병의원명 컬럼 추가 -->
            <Column v-if="companyStatisticsFilter === 'hospital'" field="hospital_name" header="병의원명" :headerStyle="{ width: '15%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.hospital_name || '-' }}
              </template>
            </Column>
            <!-- 제품별 필터일 때 제품명 컬럼 추가 -->
            <Column v-if="companyStatisticsFilter === 'product'" field="product_name" header="제품명" :headerStyle="{ width: '15%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.product_name || '-' }}
              </template>
            </Column>
            <Column field="business_registration_number" header="사업자번호" :headerStyle="{ width: '10%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
              </template>
            </Column>
            <Column field="representative_name" header="대표자" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.data.representative_name || '-' }}
              </template>
            </Column>
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '10%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column field="payment_amount" header="지급액" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.payment_amount) }}
              </template>
            </Column>
            <Column field="absorption_rate" header="흡수율" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatAbsorptionRate(slotProps.data.absorption_rate) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="companyStatisticsFilter === 'all' ? 5 : 6" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAbsorptionRate" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 업체 → 병원별 드릴다운 -->
          <template v-if="statisticsType === 'company' && drillDownLevel === 1 && drillDownType === 'hospital'">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="hospital_name" header="병의원명" :headerStyle="{ width: '30%' }" :sortable="true" />
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '20%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '25%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column header="제품 수" :headerStyle="{ width: '20%' }" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ slotProps.data.product_count || 0 }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalProductCount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 업체 → 제품별 드릴다운 -->
          <template v-if="statisticsType === 'company' && drillDownLevel === 1 && drillDownType === 'product'">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="product_name" header="제품명" :headerStyle="{ width: '30%' }" :sortable="true" />
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '20%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '25%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column header="병원 수" :headerStyle="{ width: '20%' }" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ slotProps.data.hospital_count || 0 }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalHospitalCount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 병원별 통계 테이블 -->
          <template v-if="statisticsType === 'hospital' && drillDownLevel === 0">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="hospital_name" header="병의원명" :headerStyle="{ width: '15%' }" :sortable="true" />
            <Column field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
              </template>
            </Column>
            <Column field="address" header="주소" :headerStyle="{ width: '23%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.address || '-' }}
              </template>
            </Column>
            <Column field="company_groups" header="담당업체 구분" :headerStyle="{ width: '10%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.data.company_groups || '-' }}
              </template>
            </Column>
            <Column field="company_names" header="담당업체" :headerStyle="{ width: '15%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.company_names || '-' }}
              </template>
            </Column>
            <!-- 제품별 필터일 때 제품명 컬럼 추가 -->
            <Column v-if="hospitalStatisticsFilter === 'product'" field="product_name" header="제품명" :headerStyle="{ width: '13%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.product_name || '-' }}
              </template>
            </Column>
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column field="absorption_rate" header="흡수율(%)" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatAbsorptionRate(slotProps.data.absorption_rate) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="hospitalStatisticsFilter === 'all' ? 6 : 7" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAbsorptionRate" footerClass="footer-cell" footerStyle="text-align:center !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 병원 → 제품별 드릴다운 -->
          <template v-if="statisticsType === 'hospital' && drillDownLevel === 1">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="product_name" header="제품명" :headerStyle="{ width: '40%' }" :sortable="true" />
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '25%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '30%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 제품별 통계 테이블 -->
          <template v-if="statisticsType === 'product' && drillDownLevel === 0">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="product_name" header="제품명" :headerStyle="{ width: productStatisticsFilter === 'all' ? '18%' : productStatisticsFilter === 'company' ? '15%' : '15%' }" :sortable="true">
              <template #body="slotProps">
                <span 
                  v-if="productStatisticsFilter === 'all'"
                  style="color: #1976d2; text-decoration: underline; cursor: pointer;"
                  @click="drillDownToCompany(slotProps.data)"
                >
                  {{ slotProps.data.product_name }}
                </span>
                <span v-else>
                  {{ slotProps.data.product_name }}
                </span>
              </template>
            </Column>
            <Column field="insurance_code" header="보험코드" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.data.insurance_code || '-' }}
              </template>
            </Column>
            <!-- 전체 필터일 때 약가 표시 -->
            <Column v-if="productStatisticsFilter === 'all'" field="price" header="약가" :headerStyle="{ width: '10%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.price) }}
              </template>
            </Column>
            <!-- 업체별 필터일 때 구분, 업체명, 사업자등록번호, 대표자 표시 -->
            <Column v-if="productStatisticsFilter === 'company'" field="company_group" header="구분" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.data.company_group || '-' }}
              </template>
            </Column>
            <Column v-if="productStatisticsFilter === 'company'" field="company_name" header="업체명" :headerStyle="{ width: '13%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.company_name || '-' }}
              </template>
            </Column>
            <Column v-if="productStatisticsFilter === 'company'" field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
              </template>
            </Column>
            <Column v-if="productStatisticsFilter === 'company'" field="representative_name" header="대표자" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.data.representative_name || '-' }}
              </template>
            </Column>
            <!-- 병의원별 필터일 때 병의원명, 사업자등록번호, 주소 표시 -->
            <Column v-if="productStatisticsFilter === 'hospital'" field="hospital_name" header="병의원명" :headerStyle="{ width: '13%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.hospital_name || '-' }}
              </template>
            </Column>
            <Column v-if="productStatisticsFilter === 'hospital'" field="business_registration_number" header="사업자등록번호" :headerStyle="{ width: '12%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatBusinessNumber(slotProps.data.business_registration_number) }}
              </template>
            </Column>
            <Column v-if="productStatisticsFilter === 'hospital'" field="address" header="주소" :headerStyle="{ width: '18%' }" :sortable="true">
              <template #body="slotProps">
                {{ slotProps.data.address || '-' }}
              </template>
            </Column>
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '10%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <!-- 전체 필터일 때 흡수율 표시 -->
            <Column v-if="productStatisticsFilter === 'all'" field="absorption_rate" header="흡수율(%)" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatAbsorptionRate(slotProps.data.absorption_rate) }}
              </template>
            </Column>
            <!-- 업체별, 병의원별 필터일 때 지급액 표시 -->
            <Column v-if="productStatisticsFilter === 'company' || productStatisticsFilter === 'hospital'" field="payment_amount" header="지급액" :headerStyle="{ width: '10%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.payment_amount) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="productStatisticsFilter === 'all' ? 4 : productStatisticsFilter === 'company' ? 7 : 6" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column v-if="productStatisticsFilter === 'all'" :footer="totalAbsorptionRate" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column v-if="productStatisticsFilter === 'company' || productStatisticsFilter === 'hospital'" :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 제품 → 업체별 드릴다운 -->
          <template v-if="statisticsType === 'product' && drillDownLevel === 1 && drillDownType === 'company'">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="company_name" header="업체명" :headerStyle="{ width: '40%' }" :sortable="true" />
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '25%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '30%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              </Row>
            </ColumnGroup>
          </template>

          <!-- 제품 → 병원별 드릴다운 -->
          <template v-if="statisticsType === 'product' && drillDownLevel === 1 && drillDownType === 'hospital'">
            <Column header="No" :headerStyle="{ width: '5%' }" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ slotProps.index + currentPageFirstIndex + 1 }}
              </template>
            </Column>
            <Column field="hospital_name" header="병의원명" :headerStyle="{ width: '40%' }" :sortable="true" />
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '25%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '30%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              </Row>
            </ColumnGroup>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- 전체 화면 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">데이터를 불러오는 중입니다...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import { supabase } from '@/supabase';
import ExcelJS from 'exceljs';
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils';

// Props
const props = defineProps({
  fixedStatisticsType: {
    type: String,
    default: null, // null이면 선택 가능, 'company', 'hospital', 'product' 중 하나면 고정
    validator: (value) => value === null || ['company', 'hospital', 'product'].includes(value)
  }
});

// 컴포넌트 마운트 상태 추적
const isMounted = ref(true);

// 반응형 데이터
const availableMonths = ref([]);
const selectedSettlementMonth = ref('');
const fixedStatisticsType = computed(() => props.fixedStatisticsType);
const statisticsType = ref(props.fixedStatisticsType || 'company'); // 'company', 'hospital', 'product'
const prescriptionOffset = ref(0);
const prescriptionOptions = ref([]);
const prescriptionMonth = ref('');
const loading = ref(false);

// 구분 관련
const availableCompanyGroups = ref([]);
const selectedCompanyGroup = ref('');

// 업체별 통계 필터 (전체, 병의원별, 제품별)
const companyStatisticsFilter = ref('all'); // 'all', 'hospital', 'product'

// 병의원별 통계 필터 (전체, 제품별)
const hospitalStatisticsFilter = ref('all'); // 'all', 'product'

// 제품별 통계 필터 (전체, 업체별, 병의원별)
const productStatisticsFilter = ref('all'); // 'all', 'company', 'hospital'

// 통계 계산 상태
const calculatingStatistics = ref(false);

// 드릴다운 관련
const drillDownLevel = ref(0); // 0: 메인, 1: 드릴다운
const drillDownType = ref(''); // 'hospital', 'product', 'company'
const drillDownData = ref(null); // 현재 드릴다운된 데이터

// 업체 관련
const selectedCompanyId = ref('');
const allCompanies = ref([]);
const companySearchText = ref('');
const showCompanyDropdown = ref(false);
const filteredCompanies = ref([]);
const companyHighlightedIndex = ref(-1);

// 병의원 관련
const selectedHospitalId = ref('');
const allHospitals = ref([]);
const hospitalSearchText = ref('');
const showHospitalDropdown = ref(false);
const filteredHospitals = ref([]);
const hospitalHighlightedIndex = ref(-1);

// 제품 관련
const selectedProductId = ref('');
const allProducts = ref([]);
const productSearchText = ref('');
const showProductDropdown = ref(false);
const filteredProducts = ref([]);
const productHighlightedIndex = ref(-1);

// 통계 데이터
const statisticsData = ref([]);
const currentPageFirstIndex = ref(0);

// 표시할 데이터
const displayRows = computed(() => {
  return statisticsData.value;
});

// 합계 계산
const totalQty = computed(() => {
  const sum = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_qty) || 0), 0);
  return formatNumber(sum, true);
});

const totalAmount = computed(() => {
  const sum = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
  return formatNumber(sum);
});

const totalHospitalCount = computed(() => {
  return displayRows.value.reduce((sum, row) => sum + (Number(row.hospital_count) || 0), 0);
});

const totalProductCount = computed(() => {
  return displayRows.value.reduce((sum, row) => sum + (Number(row.product_count) || 0), 0);
});

const totalCompanyCount = computed(() => {
  return displayRows.value.reduce((sum, row) => sum + (Number(row.company_count) || 0), 0);
});

const totalPaymentAmount = computed(() => {
  const sum = displayRows.value.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);
  return formatNumber(sum);
});

const totalAbsorptionRate = computed(() => {
  // 평균 흡수율 계산: 총 지급액 / 총 처방액
  const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
  const totalPaymentAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);
  if (totalPrescriptionAmount === 0) return '-';
  const avgRate = totalPaymentAmount / totalPrescriptionAmount;
  return formatAbsorptionRate(avgRate);
});

// 현재 드릴다운 라벨
const currentDrillDownLabel = computed(() => {
  if (drillDownLevel.value === 0) return '';
  if (statisticsType.value === 'company' && drillDownType.value === 'hospital') {
    return `업체: ${drillDownData.value?.company_name || ''}`;
  }
  if (statisticsType.value === 'company' && drillDownType.value === 'product') {
    return `업체: ${drillDownData.value?.company_name || ''}`;
  }
  if (statisticsType.value === 'product' && drillDownType.value === 'company') {
    return `제품: ${drillDownData.value?.product_name || ''}`;
  }
  if (statisticsType.value === 'product' && drillDownType.value === 'hospital') {
    return `제품: ${drillDownData.value?.product_name || ''}`;
  }
  return '';
});

// 유틸리티 함수
function formatNumber(value, isQty = false) {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  if (isQty) {
    return num.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return Math.round(num).toLocaleString('ko-KR');
}

function formatAbsorptionRate(value) {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  // 소수점을 백분율로 변환 (예: 0.95 -> 95.0%)
  return `${(num * 100).toFixed(1)}%`;
}

function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '-';
  
  // 숫자만 추출
  const numbers = businessNumber.replace(/[^0-9]/g, '');
  
  // 10자리가 아니면 원본 반환
  if (numbers.length !== 10) return businessNumber;
  
  // 형식 변환: ###-##-#####
  return numbers.substring(0, 3) + '-' + numbers.substring(3, 5) + '-' + numbers.substring(5);
}

function getPrescriptionMonth(settlementMonth, offset) {
  if (!settlementMonth || offset === 0) return '';
  const [y, m] = settlementMonth.split('-');
  let mm = parseInt(m, 10) - offset;
  let yy = parseInt(y, 10);
  while (mm <= 0) { mm += 12; yy -= 1; }
  return `${yy}-${String(mm).padStart(2, '0')}`;
}

function updatePrescriptionOptions() {
  if (!selectedSettlementMonth.value) {
    prescriptionOptions.value = [];
    return;
  }
  prescriptionOptions.value = [1, 2, 3, 4, 5, 6].map(offset => ({
    value: offset,
    month: getPrescriptionMonth(selectedSettlementMonth.value, offset)
  }));
}

// 데이터 fetch 함수들
async function fetchAvailableMonths() {
  try {
    const { data, error } = await supabase
      .from('settlement_months')
      .select('settlement_month, start_date, end_date')
      .order('settlement_month', { ascending: false });
    if (!error && data && data.length > 0) {
      availableMonths.value = data;
      if (!selectedSettlementMonth.value) {
        selectedSettlementMonth.value = data[0].settlement_month;
      }
    }
  } catch (err) {
    console.error('정산월 조회 오류:', err);
  }
}

async function fetchAllCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('user_type', 'user')
      .eq('approval_status', 'approved')
      .order('company_name', { ascending: true });
    if (!error && data) {
      allCompanies.value = data || [];
    }
  } catch (err) {
    console.error('업체 목록 조회 오류:', err);
  }
}

async function fetchAllHospitals() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name', { ascending: true });
    if (!error && data) {
      allHospitals.value = data || [];
    }
  } catch (err) {
    console.error('병의원 목록 조회 오류:', err);
  }
}

async function fetchAllProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, product_name')
      .order('product_name', { ascending: true });
    if (!error && data) {
      allProducts.value = data || [];
    }
  } catch (err) {
    console.error('제품 목록 조회 오류:', err);
  }
}

// 구분 항목 목록 fetch
async function fetchAvailableCompanyGroups() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('company_group')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('user_type', 'user')
      .not('company_group', 'is', null);

    if (!error && data) {
      // 중복 제거 및 정렬
      const uniqueGroups = [...new Set(data.map(item => item.company_group).filter(Boolean))]
      availableCompanyGroups.value = uniqueGroups.sort()
    }
  } catch (err) {
    console.error('구분 항목 조회 오류:', err);
  }
}

// 통계 데이터 조회
async function fetchStatistics() {
  if (!selectedSettlementMonth.value) {
    statisticsData.value = [];
    return;
  }

  loading.value = true;
  statisticsData.value = [];

  try {
    console.log('데이터 조회 시작, 정산월:', selectedSettlementMonth.value);
    
    // 먼저 통계 테이블에서 조회 시도
    let query = supabase
      .from('performance_statistics')
      .select('*')
      .eq('settlement_month', selectedSettlementMonth.value);
    
    // 통계 타입 필터
    if (statisticsType.value) {
      query = query.eq('statistics_type', statisticsType.value);
    }
    
    // 업체별 통계일 때 추가 필터
    if (statisticsType.value === 'company') {
      if (companyStatisticsFilter.value) {
        query = query.eq('company_statistics_filter', companyStatisticsFilter.value);
      }
      if (selectedCompanyGroup.value) {
        query = query.eq('company_group', selectedCompanyGroup.value);
      }
    }
    
    
    // 업체 필터
    if (selectedCompanyId.value) {
      query = query.eq('company_id', selectedCompanyId.value);
    }
    
    // 병의원별 통계일 때 추가 필터
    if (statisticsType.value === 'hospital') {
      if (hospitalStatisticsFilter.value) {
        query = query.eq('hospital_statistics_filter', hospitalStatisticsFilter.value);
      }
    }
    
    // 제품별 통계일 때 추가 필터
    if (statisticsType.value === 'product') {
      if (productStatisticsFilter.value) {
        query = query.eq('product_statistics_filter', productStatisticsFilter.value);
      }
    }
    
    // 병의원 필터
    if (selectedHospitalId.value) {
      query = query.eq('hospital_id', selectedHospitalId.value);
    }
    
    // 제품 필터
    if (selectedProductId.value) {
      query = query.eq('product_id', selectedProductId.value);
    }
    
    const { data: statisticsDataFromTable, error: statisticsError } = await query;
    
    // 통계 테이블에 데이터가 있으면 사용
    if (!statisticsError && statisticsDataFromTable && statisticsDataFromTable.length > 0) {
      console.log('통계 테이블에서 데이터 조회 성공:', statisticsDataFromTable.length, '건');
      statisticsData.value = statisticsDataFromTable.map(item => ({
        ...item,
        company_group: item.company_group_value || item.company_group
      }));
      loading.value = false;
      return;
    }
    
    // 통계 테이블에 데이터가 없으면 기존 방식으로 계산
    console.log('통계 테이블에 데이터가 없어 기존 방식으로 계산합니다.');
    
    // 실적 데이터 조회
    let performanceQuery = supabase
      .from('performance_records')
      .select(`
        *,
        companies!inner(id, company_name, company_group, business_registration_number, representative_name),
        products!inner(id, product_name, price, insurance_code),
        clients!inner(id, name, business_registration_number, address)
      `)
      .eq('settlement_month', selectedSettlementMonth.value)
      .neq('review_action', '삭제'); // 삭제된 레코드 제외


    // 업체 필터링
    if (selectedCompanyId.value) {
      performanceQuery = performanceQuery.eq('company_id', selectedCompanyId.value);
    }

    // 병의원 필터링
    if (selectedHospitalId.value) {
      performanceQuery = performanceQuery.eq('client_id', selectedHospitalId.value);
    }

    // 제품 필터링
    if (selectedProductId.value) {
      performanceQuery = performanceQuery.eq('product_id', selectedProductId.value);
    }

    // 구분 필터링 (업체별 통계일 때만)
    if (statisticsType.value === 'company' && selectedCompanyGroup.value) {
      performanceQuery = performanceQuery.eq('companies.company_group', selectedCompanyGroup.value);
    }

    // 전체 데이터 가져오기 (배치 처리)
    let allData = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await performanceQuery
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('실적 데이터 조회 오류:', error);
        console.error('에러 상세:', JSON.stringify(error, null, 2));
        alert('데이터 조회 중 오류가 발생했습니다: ' + (error.message || error));
        loading.value = false;
        return;
      }

      if (!data || data.length === 0) {
        console.log('더 이상 데이터가 없습니다. 총 조회된 데이터:', allData.length);
        break;
      }

      console.log(`배치 ${Math.floor(from / batchSize) + 1}: ${data.length}개 조회됨 (정산월: ${selectedSettlementMonth.value})`);
      allData = allData.concat(data);

      if (data.length < batchSize) {
        break;
      }

      from += batchSize;
      
      // 컴포넌트가 언마운트되었으면 중단
      if (!isMounted.value) {
        loading.value = false;
        return;
      }
    }
    
    console.log('전체 데이터 조회 완료, 총 개수:', allData.length);
    
    // 컴포넌트가 언마운트되었으면 중단
    if (!isMounted.value) {
      loading.value = false;
      return;
    }

    // 반영 흡수율 조회 (업체별 통계일 때만)
    let absorptionRates = {};
    if (statisticsType.value === 'company' && drillDownLevel.value === 0 && allData.length > 0) {
      try {
        const recordIds = allData.map(record => record.id);
        if (recordIds.length > 0) {
          console.log('흡수율 조회 시작, 총 레코드 ID 개수:', recordIds.length);
          // 배치 처리로 흡수율 조회 (병렬 처리로 성능 개선)
          const batchSize = 500; // 배치 크기 증가 (URL 길이 제한 고려)
          const batches = [];
          
          // 배치 생성
          for (let i = 0; i < recordIds.length; i += batchSize) {
            const batch = recordIds.slice(i, i + batchSize);
            batches.push(batch);
          }
          
          console.log(`총 ${batches.length}개 배치로 병렬 처리 시작`);
          
          // 병렬 처리 (동시에 최대 10개 배치 처리)
          const concurrencyLimit = 10;
          let successCount = 0;
          let errorCount = 0;
          
          for (let i = 0; i < batches.length; i += concurrencyLimit) {
            const concurrentBatches = batches.slice(i, i + concurrencyLimit);
            
            const promises = concurrentBatches.map(async (batch, batchIndex) => {
              try {
                const { data: absorptionData, error: absorptionError } = await supabase
                  .from('applied_absorption_rates')
                  .select('performance_record_id, applied_absorption_rate')
                  .in('performance_record_id', batch);
                
                if (absorptionError) {
                  console.warn(`배치 ${i + batchIndex + 1} 흡수율 조회 오류:`, absorptionError);
                  return { error: true, data: null };
                } else if (absorptionData && absorptionData.length > 0) {
                  return { error: false, data: absorptionData };
                }
                return { error: false, data: [] };
              } catch (batchErr) {
                console.warn(`배치 ${i + batchIndex + 1} 처리 중 예외:`, batchErr);
                return { error: true, data: null };
              }
            });
            
            // 동시 배치 처리 대기
            const results = await Promise.all(promises);
            
            // 결과 병합
            results.forEach(result => {
              if (result.error) {
                errorCount++;
              } else if (result.data && result.data.length > 0) {
                result.data.forEach(item => {
                  absorptionRates[item.performance_record_id] = item.applied_absorption_rate;
                });
                successCount += result.data.length;
              }
            });
            
            // 컴포넌트가 언마운트되었으면 중단
            if (!isMounted.value) {
              loading.value = false;
              return;
            }
          }
          
          console.log(`흡수율 조회 완료: 성공 ${successCount}개, 실패 배치 ${errorCount}개, 총 조회된 흡수율: ${Object.keys(absorptionRates).length}개`);
        }
      } catch (err) {
        console.warn('반영 흡수율 조회 예외:', err);
        // 에러가 발생해도 계속 진행 (기본값 1.0 사용)
      }
    }

    // 컴포넌트가 언마운트되었으면 중단
    if (!isMounted.value) {
      loading.value = false;
      return;
    }
    
    // 통계 타입에 따라 집계
    console.log('통계 타입:', statisticsType.value, '드릴다운 레벨:', drillDownLevel.value, '데이터 개수:', allData.length);
    
    if (allData.length === 0) {
      console.warn('조회된 데이터가 없습니다.');
      statisticsData.value = [];
      loading.value = false;
      return;
    }
    
    if (statisticsType.value === 'company') {
      if (drillDownLevel.value === 0) {
        // 업체별 통계
        console.log('업체별 통계 집계 시작, 흡수율 데이터 개수:', Object.keys(absorptionRates).length, '통계 필터:', companyStatisticsFilter.value);
        try {
          if (companyStatisticsFilter.value === 'hospital') {
            // 업체 + 병의원별 통계
            statisticsData.value = aggregateByCompanyAndHospital(allData, absorptionRates);
          } else if (companyStatisticsFilter.value === 'product') {
            // 업체 + 제품별 통계
            statisticsData.value = aggregateByCompanyAndProduct(allData, absorptionRates);
          } else {
            // 전체 (업체별만)
            statisticsData.value = aggregateByCompany(allData, absorptionRates);
          }
          console.log('집계 완료, 결과 개수:', statisticsData.value.length);
          if (statisticsData.value.length === 0) {
            console.warn('집계 결과가 비어있습니다. 데이터 샘플:', allData.slice(0, 2));
          }
        } catch (err) {
          console.error('집계 함수 실행 중 오류:', err);
          console.error('에러 스택:', err.stack);
          alert('데이터 집계 중 오류가 발생했습니다: ' + (err.message || err));
          statisticsData.value = [];
        }
      } else if (drillDownType.value === 'hospital') {
        // 업체 → 병원별
        statisticsData.value = aggregateByHospitalForCompany(allData, drillDownData.value?.company_id);
      } else if (drillDownType.value === 'product') {
        // 업체 → 제품별
        statisticsData.value = aggregateByProductForCompany(allData, drillDownData.value?.company_id);
      }
    } else if (statisticsType.value === 'hospital') {
      if (drillDownLevel.value === 0) {
        // 병원별 통계
        console.log('병원별 통계 집계 시작, 통계 필터:', hospitalStatisticsFilter.value);
        try {
          // 병원별 통계는 흡수율 계산 필요
          let absorptionRates = {};
          if (allData.length > 0) {
            try {
              const recordIds = allData.map(record => record.id);
              if (recordIds.length > 0) {
                console.log('흡수율 조회 시작, 총 레코드 ID 개수:', recordIds.length);
                const batchSize = 500;
                const batches = [];
                
                for (let i = 0; i < recordIds.length; i += batchSize) {
                  const batch = recordIds.slice(i, i + batchSize);
                  batches.push(batch);
                }
                
                console.log(`총 ${batches.length}개 배치로 병렬 처리 시작`);
                
                const concurrencyLimit = 10;
                let successCount = 0;
                let errorCount = 0;
                
                for (let i = 0; i < batches.length; i += concurrencyLimit) {
                  const concurrentBatches = batches.slice(i, i + concurrencyLimit);
                  
                  const promises = concurrentBatches.map(async (batch) => {
                    try {
                      const { data: absorptionData, error: absorptionError } = await supabase
                        .from('applied_absorption_rates')
                        .select('performance_record_id, applied_absorption_rate')
                        .in('performance_record_id', batch);
                      
                      if (absorptionError) {
                        console.warn(`배치 ${i + 1} 흡수율 조회 오류:`, absorptionError);
                        return { error: true, data: null };
                      } else if (absorptionData && absorptionData.length > 0) {
                        return { error: false, data: absorptionData };
                      }
                      return { error: false, data: [] };
                    } catch (batchErr) {
                      console.warn(`배치 ${i + 1} 처리 중 예외:`, batchErr);
                      return { error: true, data: null };
                    }
                  });
                  
                  const results = await Promise.all(promises);
                  
                  results.forEach(result => {
                    if (result.error) {
                      errorCount++;
                    } else if (result.data && result.data.length > 0) {
                      result.data.forEach(item => {
                        absorptionRates[item.performance_record_id] = item.applied_absorption_rate;
                      });
                      successCount += result.data.length;
                    }
                  });
                  
                  if (!isMounted.value) {
                    loading.value = false;
                    return;
                  }
                }
                
                console.log(`흡수율 조회 완료: 성공 ${successCount}개, 실패 배치 ${errorCount}개, 총 조회된 흡수율: ${Object.keys(absorptionRates).length}개`);
              }
            } catch (err) {
              console.warn('반영 흡수율 조회 예외:', err);
            }
          }
          
          if (hospitalStatisticsFilter.value === 'product') {
            // 병원 + 제품별 통계 (흡수율 계산 필요)
            statisticsData.value = aggregateByHospitalAndProduct(allData, absorptionRates);
          } else {
            // 전체 (병원별만)
            statisticsData.value = aggregateByHospital(allData, absorptionRates);
          }
          console.log('집계 완료, 결과 개수:', statisticsData.value.length);
        } catch (err) {
          console.error('집계 함수 실행 중 오류:', err);
          console.error('에러 스택:', err.stack);
          alert('데이터 집계 중 오류가 발생했습니다: ' + (err.message || err));
          statisticsData.value = [];
        }
      } else {
        // 병원 → 제품별
        statisticsData.value = aggregateByProductForHospital(allData, drillDownData.value?.hospital_id);
      }
    } else if (statisticsType.value === 'product') {
      if (drillDownLevel.value === 0) {
        // 제품별 통계 - 흡수율 조회 필요
        let absorptionRates = {};
        if (allData.length > 0) {
          try {
            const recordIds = allData.map(record => record.id);
            if (recordIds.length > 0) {
              console.log('흡수율 조회 시작, 총 레코드 ID 개수:', recordIds.length);
              const batchSize = 500;
              const batches = [];
              
              for (let i = 0; i < recordIds.length; i += batchSize) {
                const batch = recordIds.slice(i, i + batchSize);
                batches.push(batch);
              }
              
              const concurrencyLimit = 5;
              for (let i = 0; i < batches.length; i += concurrencyLimit) {
                const concurrentBatches = batches.slice(i, i + concurrencyLimit);
                
                const promises = concurrentBatches.map(async (batch) => {
                  try {
                    const { data: absorptionData, error: absorptionError } = await supabase
                      .from('applied_absorption_rates')
                      .select('performance_record_id, applied_absorption_rate')
                      .in('performance_record_id', batch);
                    
                    if (absorptionError) {
                      console.error('흡수율 조회 오류:', absorptionError);
                      return { data: [], error: absorptionError };
                    }
                    
                    return { data: absorptionData || [], error: null };
                  } catch (err) {
                    console.error('흡수율 조회 예외:', err);
                    return { data: [], error: err };
                  }
                });
                
                const results = await Promise.all(promises);
                
                results.forEach(result => {
                  if (result.data && result.data.length > 0) {
                    result.data.forEach(item => {
                      absorptionRates[item.performance_record_id] = item.applied_absorption_rate;
                    });
                  }
                });
                
                if (!isMounted.value) {
                  loading.value = false;
                  return;
                }
              }
              
              console.log(`흡수율 조회 완료, 총 조회된 흡수율: ${Object.keys(absorptionRates).length}개`);
            }
          } catch (err) {
            console.warn('반영 흡수율 조회 예외:', err);
          }
        }
        
        console.log('제품별 통계 집계 시작, 통계 필터:', productStatisticsFilter.value);
        try {
          if (productStatisticsFilter.value === 'company') {
            // 제품 + 업체별 통계
            statisticsData.value = aggregateByProductAndCompany(allData, absorptionRates);
          } else if (productStatisticsFilter.value === 'hospital') {
            // 제품 + 병의원별 통계
            statisticsData.value = aggregateByProductAndHospital(allData, absorptionRates);
          } else {
            // 전체 (제품별만)
            statisticsData.value = aggregateByProduct(allData, absorptionRates);
          }
          console.log('집계 완료, 결과 개수:', statisticsData.value.length);
        } catch (err) {
          console.error('집계 함수 실행 중 오류:', err);
          console.error('에러 스택:', err.stack);
          alert('데이터 집계 중 오류가 발생했습니다: ' + (err.message || err));
          statisticsData.value = [];
        }
      } else if (drillDownType.value === 'company') {
        // 제품 → 업체별
        statisticsData.value = aggregateByCompanyForProduct(allData, drillDownData.value?.product_id);
      } else if (drillDownType.value === 'hospital') {
        // 제품 → 병원별
        statisticsData.value = aggregateByHospitalForProduct(allData, drillDownData.value?.product_id);
      }
    }

  } catch (err) {
    // 컴포넌트가 언마운트되었으면 에러 표시하지 않음
    if (!isMounted.value) {
      return;
    }
    console.error('통계 데이터 조회 예외:', err);
    alert('데이터 조회 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    if (isMounted.value) {
      loading.value = false;
    }
  }
}

// 집계 함수들
function aggregateByCompany(data, absorptionRates = {}) {
  const map = new Map();
  
  if (!data || data.length === 0) {
    console.warn('aggregateByCompany: 데이터가 없습니다.');
    return [];
  }
  
  console.log('aggregateByCompany 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
    // 삭제 처리된 건은 제외
    if (record.review_action === '삭제') return;
    
    const companyId = record.company_id;
    if (!companyId) {
      console.warn('company_id가 없는 레코드:', record);
      return;
    }
    
    const companyName = record.companies?.company_name || '';
    const companyGroup = record.companies?.company_group || '';
    const businessRegistrationNumber = record.companies?.business_registration_number || '';
    const representativeName = record.companies?.representative_name || '';
    const commissionRate = Number(record.commission_rate) || 0;
    const qty = Number(record.prescription_qty) || 0;
    const price = Number(record.products?.price) || 0;
    const amount = qty * price;
    
    // 반영 흡수율 가져오기 (기본값 1.0)
    let appliedAbsorptionRate = 1.0;
    if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
      const rateValue = Number(absorptionRates[record.id]);
      if (!isNaN(rateValue)) {
        appliedAbsorptionRate = rateValue;
      }
    }
    
    // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
    const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

    if (!map.has(companyId)) {
      map.set(companyId, {
        company_id: companyId,
        company_name: companyName,
        company_group: companyGroup,
        business_registration_number: businessRegistrationNumber,
        representative_name: representativeName,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        total_absorption_rate: 0,
        total_prescription_amount: 0
      });
    }

    const item = map.get(companyId);
    item.prescription_qty += qty;
    item.prescription_amount += amount;
    item.payment_amount += paymentAmount;
    // 흡수율 계산을 위한 누적값
    item.total_absorption_rate += amount * appliedAbsorptionRate;
    item.total_prescription_amount += amount;
    processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  console.log(`집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    // 평균 흡수율 계산: (처방액 × 흡수율의 합) / 처방액 합
    const absorptionRate = item.total_prescription_amount > 0 
      ? item.total_absorption_rate / item.total_prescription_amount 
      : 0;
    
    const result = {
      company_id: item.company_id,
      company_name: item.company_name,
      company_group: item.company_group,
      business_registration_number: item.business_registration_number,
      representative_name: item.representative_name,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      absorption_rate: absorptionRate
    };
    return result;
  });
}

function aggregateByHospital(data, absorptionRates = {}) {
  const map = new Map();
  
  data.forEach(record => {
    // 삭제 처리된 건은 제외
    if (record.review_action === '삭제') return;
    
    const hospitalId = record.client_id;
    const hospitalName = record.clients?.name || '';
    const businessRegistrationNumber = record.clients?.business_registration_number || '';
    const address = record.clients?.address || '';
    const companyId = record.company_id;
    const companyName = record.companies?.company_name || '';
    const qty = Number(record.prescription_qty) || 0;
    const price = Number(record.products?.price) || 0;
    const amount = qty * price;
    const productId = record.product_id;
    const commissionRate = Number(record.commission_rate) || 0;
    
    // 반영 흡수율 가져오기 (기본값 1.0)
    let appliedAbsorptionRate = 1.0;
    if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
      const rateValue = Number(absorptionRates[record.id]);
      if (!isNaN(rateValue)) {
        appliedAbsorptionRate = rateValue;
      }
    }
    
    // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
    // commission_rate는 소수점 형태 (예: 0.36 = 36%)
    const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

    if (!map.has(hospitalId)) {
      map.set(hospitalId, {
        hospital_id: hospitalId,
        hospital_name: hospitalName,
        business_registration_number: businessRegistrationNumber,
        address: address,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        total_absorption_rate: 0,
        total_prescription_amount: 0,
        companies: new Set(), // 담당업체 목록
        companyGroups: new Set(), // 담당업체 구분 목록
        products: new Set()
      });
    }

    const item = map.get(hospitalId);
    item.prescription_qty += qty;
    item.prescription_amount += amount;
    item.payment_amount += paymentAmount;
    // 흡수율 계산을 위한 누적값
    item.total_absorption_rate += amount * appliedAbsorptionRate;
    item.total_prescription_amount += amount;
    if (companyId && companyName) {
      item.companies.add(companyName);
    }
    const companyGroup = record.companies?.company_group || '';
    if (companyGroup) {
      item.companyGroups.add(companyGroup);
    }
    if (productId) item.products.add(productId);
  });

  return Array.from(map.values()).map(item => {
    // 흡수율 계산: 지급액 / 처방액 (실제 지급액 기준으로 계산)
    const absorptionRate = item.prescription_amount > 0 
      ? item.payment_amount / item.prescription_amount 
      : 0;
    
    // 담당업체 목록을 콤마로 구분
    const companyNames = Array.from(item.companies).sort().join(', ');
    // 담당업체 구분 목록을 콤마로 구분
    const companyGroups = Array.from(item.companyGroups).sort().join(', ');
    
    const result = {
      hospital_id: item.hospital_id,
      hospital_name: item.hospital_name,
      business_registration_number: item.business_registration_number,
      address: item.address,
      company_names: companyNames,
      company_groups: companyGroups,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      absorption_rate: absorptionRate,
      product_count: item.products.size
    };
    return result;
  });
}

function aggregateByProduct(data, absorptionRates = {}) {
  const map = new Map();
  
  data.forEach(record => {
    // 삭제 처리된 건은 제외
    if (record.review_action === '삭제') return;
    
    const productId = record.product_id;
    const productName = record.products?.product_name || '';
    const insuranceCode = record.products?.insurance_code || '';
    const price = Number(record.products?.price) || 0;
    const qty = Number(record.prescription_qty) || 0;
    const amount = qty * price;
    const companyId = record.company_id;
    const hospitalId = record.client_id;
    const commissionRate = Number(record.commission_rate) || 0;
    
    // 반영 흡수율 가져오기 (기본값 1.0)
    let appliedAbsorptionRate = 1.0;
    if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
      const rateValue = Number(absorptionRates[record.id]);
      if (!isNaN(rateValue)) {
        appliedAbsorptionRate = rateValue;
      }
    }
    
    // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
    const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

    if (!map.has(productId)) {
      map.set(productId, {
        product_id: productId,
        product_name: productName,
        insurance_code: insuranceCode,
        price: price,
        prescription_qty: 0,
        prescription_amount: 0,
        payment_amount: 0,
        total_absorption_rate: 0,
        total_prescription_amount: 0,
        companies: new Set(),
        hospitals: new Set()
      });
    }

    const item = map.get(productId);
    item.prescription_qty += qty;
    item.prescription_amount += amount;
    item.payment_amount += paymentAmount;
    // 흡수율 계산을 위한 누적값
    item.total_absorption_rate += amount * appliedAbsorptionRate;
    item.total_prescription_amount += amount;
    if (companyId) item.companies.add(companyId);
    if (hospitalId) item.hospitals.add(hospitalId);
  });

  return Array.from(map.values()).map(item => {
    // 평균 흡수율 계산: (처방액 × 흡수율의 합) / 처방액 합
    const absorptionRate = item.total_prescription_amount > 0 
      ? item.total_absorption_rate / item.total_prescription_amount 
      : 0;
    
    const result = {
      product_id: item.product_id,
      product_name: item.product_name,
      insurance_code: item.insurance_code,
      price: item.price,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      absorption_rate: absorptionRate,
      company_count: item.companies.size,
      hospital_count: item.hospitals.size
    };
    return result;
  });
}

function aggregateByHospitalForCompany(data, companyId) {
  const filtered = data.filter(r => r.company_id === companyId);
  return aggregateByHospital(filtered);
}

function aggregateByProductForCompany(data, companyId) {
  const filtered = data.filter(r => r.company_id === companyId);
  return aggregateByProduct(filtered);
}

function aggregateByProductForHospital(data, hospitalId) {
  const filtered = data.filter(r => r.client_id === hospitalId);
  return aggregateByProduct(filtered);
}

// 업체 + 병의원별 집계
function aggregateByCompanyAndHospital(data, absorptionRates = {}) {
  const map = new Map();
  
  if (!data || data.length === 0) {
    console.warn('aggregateByCompanyAndHospital: 데이터가 없습니다.');
    return [];
  }
  
  console.log('aggregateByCompanyAndHospital 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건은 제외
      if (record.review_action === '삭제') return;
      
      const companyId = record.company_id;
      const hospitalId = record.client_id;
      if (!companyId || !hospitalId) {
        return;
      }
      
      // 키: companyId_hospitalId
      const key = `${companyId}_${hospitalId}`;
      
      const companyName = record.companies?.company_name || '';
      const companyGroup = record.companies?.company_group || '';
      const businessRegistrationNumber = record.companies?.business_registration_number || '';
      const representativeName = record.companies?.representative_name || '';
      const hospitalName = record.clients?.name || '';
      const commissionRate = Number(record.commission_rate) || 0;
      const qty = Number(record.prescription_qty) || 0;
      const price = Number(record.products?.price) || 0;
      const amount = qty * price;
      
      // 반영 흡수율 가져오기 (기본값 1.0)
      let appliedAbsorptionRate = 1.0;
      if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
        const rateValue = Number(absorptionRates[record.id]);
        if (!isNaN(rateValue)) {
          appliedAbsorptionRate = rateValue;
        }
      }
      
      // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
      const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

      if (!map.has(key)) {
        map.set(key, {
          company_id: companyId,
          company_name: companyName,
          company_group: companyGroup,
          business_registration_number: businessRegistrationNumber,
          representative_name: representativeName,
          hospital_id: hospitalId,
          hospital_name: hospitalName,
          prescription_qty: 0,
          prescription_amount: 0,
          payment_amount: 0,
          total_absorption_rate: 0,
          total_prescription_amount: 0
        });
      }

      const item = map.get(key);
      item.prescription_qty += qty;
      item.prescription_amount += amount;
      item.payment_amount += paymentAmount;
      // 흡수율 계산을 위한 누적값
      item.total_absorption_rate += amount * appliedAbsorptionRate;
      item.total_prescription_amount += amount;
      processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  console.log(`aggregateByCompanyAndHospital 집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    // 평균 흡수율 계산: (처방액 × 흡수율의 합) / 처방액 합
    const absorptionRate = item.total_prescription_amount > 0 
      ? item.total_absorption_rate / item.total_prescription_amount 
      : 0;
    
    return {
      company_id: item.company_id,
      company_name: item.company_name,
      company_group: item.company_group,
      business_registration_number: item.business_registration_number,
      representative_name: item.representative_name,
      hospital_id: item.hospital_id,
      hospital_name: item.hospital_name,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      absorption_rate: absorptionRate
    };
  });
}

// 업체 + 제품별 집계
function aggregateByCompanyAndProduct(data, absorptionRates = {}) {
  const map = new Map();
  
  if (!data || data.length === 0) {
    console.warn('aggregateByCompanyAndProduct: 데이터가 없습니다.');
    return [];
  }
  
  console.log('aggregateByCompanyAndProduct 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건은 제외
      if (record.review_action === '삭제') return;
      
      const companyId = record.company_id;
      const productId = record.product_id;
      if (!companyId || !productId) {
        return;
      }
      
      // 키: companyId_productId
      const key = `${companyId}_${productId}`;
      
      const companyName = record.companies?.company_name || '';
      const companyGroup = record.companies?.company_group || '';
      const businessRegistrationNumber = record.companies?.business_registration_number || '';
      const representativeName = record.companies?.representative_name || '';
      const productName = record.products?.product_name || '';
      const commissionRate = Number(record.commission_rate) || 0;
      const qty = Number(record.prescription_qty) || 0;
      const price = Number(record.products?.price) || 0;
      const amount = qty * price;
      
      // 반영 흡수율 가져오기 (기본값 1.0)
      let appliedAbsorptionRate = 1.0;
      if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
        const rateValue = Number(absorptionRates[record.id]);
        if (!isNaN(rateValue)) {
          appliedAbsorptionRate = rateValue;
        }
      }
      
      // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
      const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

      if (!map.has(key)) {
        map.set(key, {
          company_id: companyId,
          company_name: companyName,
          company_group: companyGroup,
          business_registration_number: businessRegistrationNumber,
          representative_name: representativeName,
          product_id: productId,
          product_name: productName,
          prescription_qty: 0,
          prescription_amount: 0,
          payment_amount: 0,
          total_absorption_rate: 0,
          total_prescription_amount: 0
        });
      }

      const item = map.get(key);
      item.prescription_qty += qty;
      item.prescription_amount += amount;
      item.payment_amount += paymentAmount;
      // 흡수율 계산을 위한 누적값
      item.total_absorption_rate += amount * appliedAbsorptionRate;
      item.total_prescription_amount += amount;
      processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  console.log(`aggregateByCompanyAndProduct 집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    // 평균 흡수율 계산: (처방액 × 흡수율의 합) / 처방액 합
    const absorptionRate = item.total_prescription_amount > 0 
      ? item.total_absorption_rate / item.total_prescription_amount 
      : 0;
    
    return {
      company_id: item.company_id,
      company_name: item.company_name,
      company_group: item.company_group,
      business_registration_number: item.business_registration_number,
      representative_name: item.representative_name,
      product_id: item.product_id,
      product_name: item.product_name,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      absorption_rate: absorptionRate
    };
  });
}

function aggregateByCompanyForProduct(data, productId) {
  const filtered = data.filter(r => r.product_id === productId);
  return aggregateByCompany(filtered);
}

function aggregateByHospitalForProduct(data, productId) {
  const filtered = data.filter(r => r.product_id === productId);
  return aggregateByHospital(filtered);
}

// 제품 + 업체별 집계
function aggregateByProductAndCompany(data, absorptionRates = {}) {
  const map = new Map();
  
  if (!data || data.length === 0) {
    console.warn('aggregateByProductAndCompany: 데이터가 없습니다.');
    return [];
  }
  
  console.log('aggregateByProductAndCompany 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건은 제외
      if (record.review_action === '삭제') return;
      
      const productId = record.product_id;
      const companyId = record.company_id;
      if (!productId || !companyId) {
        return;
      }
      
      // 키: productId_companyId
      const key = `${productId}_${companyId}`;
      
      const productName = record.products?.product_name || '';
      const insuranceCode = record.products?.insurance_code || '';
      const companyName = record.companies?.company_name || '';
      const companyGroup = record.companies?.company_group || '';
      const businessRegistrationNumber = record.companies?.business_registration_number || '';
      const representativeName = record.companies?.representative_name || '';
      const qty = Number(record.prescription_qty) || 0;
      const price = Number(record.products?.price) || 0;
      const amount = qty * price;
      const commissionRate = Number(record.commission_rate) || 0;
      
      // 반영 흡수율 가져오기 (기본값 1.0)
      let appliedAbsorptionRate = 1.0;
      if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
        const rateValue = Number(absorptionRates[record.id]);
        if (!isNaN(rateValue)) {
          appliedAbsorptionRate = rateValue;
        }
      }
      
      // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
      const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

      if (!map.has(key)) {
        map.set(key, {
          product_id: productId,
          product_name: productName,
          insurance_code: insuranceCode,
          company_id: companyId,
          company_name: companyName,
          company_group: companyGroup,
          business_registration_number: businessRegistrationNumber,
          representative_name: representativeName,
          prescription_qty: 0,
          prescription_amount: 0,
          payment_amount: 0
        });
      }

      const item = map.get(key);
      item.prescription_qty += qty;
      item.prescription_amount += amount;
      item.payment_amount += paymentAmount;
      processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  console.log(`aggregateByProductAndCompany 집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    return {
      product_id: item.product_id,
      product_name: item.product_name,
      insurance_code: item.insurance_code,
      company_id: item.company_id,
      company_name: item.company_name,
      company_group: item.company_group,
      business_registration_number: item.business_registration_number,
      representative_name: item.representative_name,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount
    };
  });
}

// 제품 + 병의원별 집계
function aggregateByProductAndHospital(data, absorptionRates = {}) {
  const map = new Map();
  
  if (!data || data.length === 0) {
    console.warn('aggregateByProductAndHospital: 데이터가 없습니다.');
    return [];
  }
  
  console.log('aggregateByProductAndHospital 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건은 제외
      if (record.review_action === '삭제') return;
      
      const productId = record.product_id;
      const hospitalId = record.client_id;
      if (!productId || !hospitalId) {
        return;
      }
      
      // 키: productId_hospitalId
      const key = `${productId}_${hospitalId}`;
      
      const productName = record.products?.product_name || '';
      const insuranceCode = record.products?.insurance_code || '';
      const hospitalName = record.clients?.name || '';
      const businessRegistrationNumber = record.clients?.business_registration_number || '';
      const address = record.clients?.address || '';
      const qty = Number(record.prescription_qty) || 0;
      const price = Number(record.products?.price) || 0;
      const amount = qty * price;
      const commissionRate = Number(record.commission_rate) || 0;
      
      // 반영 흡수율 가져오기 (기본값 1.0)
      let appliedAbsorptionRate = 1.0;
      if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
        const rateValue = Number(absorptionRates[record.id]);
        if (!isNaN(rateValue)) {
          appliedAbsorptionRate = rateValue;
        }
      }
      
      // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
      const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

      if (!map.has(key)) {
        map.set(key, {
          product_id: productId,
          product_name: productName,
          insurance_code: insuranceCode,
          hospital_id: hospitalId,
          hospital_name: hospitalName,
          business_registration_number: businessRegistrationNumber,
          address: address,
          prescription_qty: 0,
          prescription_amount: 0,
          payment_amount: 0
        });
      }

      const item = map.get(key);
      item.prescription_qty += qty;
      item.prescription_amount += amount;
      item.payment_amount += paymentAmount;
      processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  console.log(`aggregateByProductAndHospital 집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    return {
      product_id: item.product_id,
      product_name: item.product_name,
      insurance_code: item.insurance_code,
      hospital_id: item.hospital_id,
      hospital_name: item.hospital_name,
      business_registration_number: item.business_registration_number,
      address: item.address,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount
    };
  });
}

// 병원 + 제품별 집계
function aggregateByHospitalAndProduct(data, absorptionRates = {}) {
  const map = new Map();
  
  if (!data || data.length === 0) {
    console.warn('aggregateByHospitalAndProduct: 데이터가 없습니다.');
    return [];
  }
  
  console.log('aggregateByHospitalAndProduct 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건은 제외
      if (record.review_action === '삭제') return;
      
      const hospitalId = record.client_id;
      const productId = record.product_id;
      if (!hospitalId || !productId) {
        return;
      }
      
      // 키: hospitalId_productId
      const key = `${hospitalId}_${productId}`;
      
      const hospitalName = record.clients?.name || '';
      const businessRegistrationNumber = record.clients?.business_registration_number || '';
      const address = record.clients?.address || '';
      const companyId = record.company_id;
      const companyName = record.companies?.company_name || '';
      const productName = record.products?.product_name || '';
      const qty = Number(record.prescription_qty) || 0;
      const price = Number(record.products?.price) || 0;
      const amount = qty * price;
      const commissionRate = Number(record.commission_rate) || 0;
      
      // 반영 흡수율 가져오기 (기본값 1.0)
      let appliedAbsorptionRate = 1.0;
      if (absorptionRates[record.id] !== null && absorptionRates[record.id] !== undefined) {
        const rateValue = Number(absorptionRates[record.id]);
        if (!isNaN(rateValue)) {
          appliedAbsorptionRate = rateValue;
        }
      }
      
      // 지급액 계산: 처방액 × 반영 흡수율 × 수수료율
      const paymentAmount = Math.round(amount * appliedAbsorptionRate * commissionRate);

      if (!map.has(key)) {
        map.set(key, {
          hospital_id: hospitalId,
          hospital_name: hospitalName,
          business_registration_number: businessRegistrationNumber,
          address: address,
          product_id: productId,
          product_name: productName,
          prescription_qty: 0,
          prescription_amount: 0,
          payment_amount: 0,
          total_absorption_rate: 0,
          total_prescription_amount: 0,
          companies: new Set(), // 담당업체 목록
          companyGroups: new Set() // 담당업체 구분 목록
        });
      }

      const item = map.get(key);
      item.prescription_qty += qty;
      item.prescription_amount += amount;
      item.payment_amount += paymentAmount;
      // 흡수율 계산을 위한 누적값
      item.total_absorption_rate += amount * appliedAbsorptionRate;
      item.total_prescription_amount += amount;
      if (companyId && companyName) {
        item.companies.add(companyName);
      }
      const companyGroup = record.companies?.company_group || '';
      if (companyGroup) {
        item.companyGroups.add(companyGroup);
      }
      processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  console.log(`aggregateByHospitalAndProduct 집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    // 흡수율 계산: 지급액 / 처방액 (실제 지급액 기준으로 계산)
    const absorptionRate = item.prescription_amount > 0 
      ? item.payment_amount / item.prescription_amount 
      : 0;
    
    // 담당업체 목록을 콤마로 구분
    const companyNames = Array.from(item.companies).sort().join(', ');
    // 담당업체 구분 목록을 콤마로 구분
    const companyGroups = Array.from(item.companyGroups).sort().join(', ');
    
    return {
      hospital_id: item.hospital_id,
      hospital_name: item.hospital_name,
      business_registration_number: item.business_registration_number,
      address: item.address,
      company_names: companyNames,
      company_groups: companyGroups,
      product_id: item.product_id,
      product_name: item.product_name,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      absorption_rate: absorptionRate
    };
  });
}

// 드릴다운 함수들
function drillDownToHospital(data) {
  drillDownLevel.value = 1;
  drillDownType.value = 'hospital';
  drillDownData.value = data;
  fetchStatistics();
}

function drillDownToProduct(data) {
  drillDownLevel.value = 1;
  drillDownType.value = 'product';
  drillDownData.value = data;
  fetchStatistics();
}

function drillDownToCompany(data) {
  drillDownLevel.value = 1;
  drillDownType.value = 'company';
  drillDownData.value = data;
  fetchStatistics();
}

function drillDownToHospitalFromProduct(data) {
  drillDownLevel.value = 1;
  drillDownType.value = 'hospital';
  drillDownData.value = data;
  fetchStatistics();
}

function goBack() {
  drillDownLevel.value = 0;
  drillDownType.value = '';
  drillDownData.value = null;
  fetchStatistics();
}

// 검색 관련 함수들 (업체)
function handleCompanySearch() {
  const searchTerm = companySearchText.value.toLowerCase().trim();
  if (!searchTerm) {
    filteredCompanies.value = allCompanies.value.slice(0, 100);
  } else {
    filteredCompanies.value = allCompanies.value
      .filter(company => company.company_name.toLowerCase().includes(searchTerm))
      .slice(0, 100);
  }
  companyHighlightedIndex.value = -1;
  showCompanyDropdown.value = true;
}

function selectCompany(company) {
  selectedCompanyId.value = company.id;
  companySearchText.value = company.id === '' ? '' : company.company_name;
  showCompanyDropdown.value = false;
  companyHighlightedIndex.value = -1;
  fetchStatistics();
}

function handleCompanyFocus() {
  if (allCompanies.value.length > 0) {
    handleCompanySearch();
  }
}

function delayedHideCompanyDropdown() {
  setTimeout(() => {
    showCompanyDropdown.value = false;
  }, 200);
}

function handleCompanyKeydown(event) {
  if (!showCompanyDropdown.value) return;
  const totalItems = filteredCompanies.value.length + 1;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      companyHighlightedIndex.value = Math.min(companyHighlightedIndex.value + 1, totalItems - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      companyHighlightedIndex.value = Math.max(companyHighlightedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (companyHighlightedIndex.value === 0) {
        selectCompany({ id: '', company_name: '전체' });
      } else if (companyHighlightedIndex.value > 0) {
        const index = companyHighlightedIndex.value - 1;
        if (index < filteredCompanies.value.length) {
          selectCompany(filteredCompanies.value[index]);
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      showCompanyDropdown.value = false;
      companyHighlightedIndex.value = -1;
      break;
  }
}

// 검색 관련 함수들 (병의원)
function handleHospitalSearch() {
  const searchTerm = hospitalSearchText.value.toLowerCase().trim();
  if (!searchTerm) {
    filteredHospitals.value = allHospitals.value.slice(0, 100);
  } else {
    filteredHospitals.value = allHospitals.value
      .filter(hospital => hospital.name.toLowerCase().includes(searchTerm))
      .slice(0, 100);
  }
  hospitalHighlightedIndex.value = -1;
  showHospitalDropdown.value = true;
}

function selectHospital(hospital) {
  selectedHospitalId.value = hospital.id;
  hospitalSearchText.value = hospital.id === '' ? '' : hospital.name;
  showHospitalDropdown.value = false;
  hospitalHighlightedIndex.value = -1;
  fetchStatistics();
}

function handleHospitalFocus() {
  if (allHospitals.value.length > 0) {
    handleHospitalSearch();
  }
}

function delayedHideHospitalDropdown() {
  setTimeout(() => {
    showHospitalDropdown.value = false;
  }, 200);
}

function handleHospitalKeydown(event) {
  if (!showHospitalDropdown.value) return;
  const totalItems = filteredHospitals.value.length + 1;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      hospitalHighlightedIndex.value = Math.min(hospitalHighlightedIndex.value + 1, totalItems - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      hospitalHighlightedIndex.value = Math.max(hospitalHighlightedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (hospitalHighlightedIndex.value === 0) {
        selectHospital({ id: '', name: '전체' });
      } else if (hospitalHighlightedIndex.value > 0) {
        const index = hospitalHighlightedIndex.value - 1;
        if (index < filteredHospitals.value.length) {
          selectHospital(filteredHospitals.value[index]);
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      showHospitalDropdown.value = false;
      hospitalHighlightedIndex.value = -1;
      break;
  }
}

// 검색 관련 함수들 (제품)
function handleProductSearch() {
  const searchTerm = productSearchText.value.toLowerCase().trim();
  if (!searchTerm) {
    filteredProducts.value = allProducts.value.slice(0, 100);
  } else {
    filteredProducts.value = allProducts.value
      .filter(product => product.product_name.toLowerCase().includes(searchTerm))
      .slice(0, 100);
  }
  productHighlightedIndex.value = -1;
  showProductDropdown.value = true;
}

function selectProduct(product) {
  selectedProductId.value = product.id;
  productSearchText.value = product.id === '' ? '' : product.product_name;
  showProductDropdown.value = false;
  productHighlightedIndex.value = -1;
  fetchStatistics();
}

function handleProductFocus() {
  if (allProducts.value.length > 0) {
    handleProductSearch();
  }
}

function delayedHideProductDropdown() {
  setTimeout(() => {
    showProductDropdown.value = false;
  }, 200);
}

function handleProductKeydown(event) {
  if (!showProductDropdown.value) return;
  const totalItems = filteredProducts.value.length + 1;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      productHighlightedIndex.value = Math.min(productHighlightedIndex.value + 1, totalItems - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      productHighlightedIndex.value = Math.max(productHighlightedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (productHighlightedIndex.value === 0) {
        selectProduct({ id: '', product_name: '전체' });
      } else if (productHighlightedIndex.value > 0) {
        const index = productHighlightedIndex.value - 1;
        if (index < filteredProducts.value.length) {
          selectProduct(filteredProducts.value[index]);
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      showProductDropdown.value = false;
      productHighlightedIndex.value = -1;
      break;
  }
}

// 이벤트 핸들러
function onSettlementMonthChange() {
  prescriptionOffset.value = 0;
  prescriptionMonth.value = '';
  resetFilters();
  fetchStatistics();
}

function onStatisticsTypeChange() {
  // 고정된 타입이면 변경 불가
  if (fixedStatisticsType.value) {
    statisticsType.value = fixedStatisticsType.value;
    return;
  }
  drillDownLevel.value = 0;
  drillDownType.value = '';
  drillDownData.value = null;
  resetFilters();
  fetchStatistics();
}


function resetFilters() {
  selectedCompanyId.value = '';
  selectedHospitalId.value = '';
  selectedProductId.value = '';
  selectedCompanyGroup.value = '';
  companyStatisticsFilter.value = 'all';
  hospitalStatisticsFilter.value = 'all';
  productStatisticsFilter.value = 'all';
  companySearchText.value = '';
  hospitalSearchText.value = '';
  productSearchText.value = '';
}

function onCompanyStatisticsFilterChange() {
  // 통계 필터가 변경되면 실적 데이터 다시 로드
  if (selectedSettlementMonth.value) {
    fetchStatistics();
  }
}

function onHospitalStatisticsFilterChange() {
  // 통계 필터가 변경되면 실적 데이터 다시 로드
  if (selectedSettlementMonth.value) {
    fetchStatistics();
  }
}

function onProductStatisticsFilterChange() {
  // 통계 필터가 변경되면 실적 데이터 다시 로드
  if (selectedSettlementMonth.value) {
    fetchStatistics();
  }
}

// 통계 계산 함수 (Edge Function 호출)
async function calculateStatistics() {
  if (!selectedSettlementMonth.value) {
    alert('정산월을 선택해주세요.');
    return;
  }

  if (!confirm(`${selectedSettlementMonth.value} 정산월의 통계를 계산하시겠습니까?\n이 작업은 시간이 걸릴 수 있습니다.`)) {
    return;
  }

  calculatingStatistics.value = true;

  try {
    const requestBody = {
      settlement_month: selectedSettlementMonth.value
    };

    // 통계 타입 추가
    if (statisticsType.value) {
      requestBody.statistics_type = statisticsType.value;
    }

    // 업체별 통계일 때 추가 파라미터
    if (statisticsType.value === 'company') {
      if (companyStatisticsFilter.value) {
        requestBody.company_statistics_filter = companyStatisticsFilter.value;
      }
      if (selectedCompanyGroup.value) {
        requestBody.company_group = selectedCompanyGroup.value;
      }
    }

    // 병의원별 통계일 때 추가 파라미터
    if (statisticsType.value === 'hospital') {
      if (hospitalStatisticsFilter.value) {
        requestBody.hospital_statistics_filter = hospitalStatisticsFilter.value;
      }
    }


    console.log('통계 계산 요청:', requestBody);
    
    // 직접 fetch를 사용하여 에러 응답 본문을 읽을 수 있도록 함
    const supabaseConfig = await import('@/config/supabase.js')
    const supabaseUrl = supabaseConfig.default.url || 'https://vbmmfuraxvxlfpewqrsm.supabase.co'
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const anonKey = supabaseConfig.default.anonKey

    const response = await fetch(`${supabaseUrl}/functions/v1/calculate-statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()
    console.log('Edge Function 응답 상태:', response.status)
    console.log('Edge Function 응답 본문:', responseText)

    if (!response.ok) {
      let errorMessage = '통계 계산 중 오류가 발생했습니다.'
      let errorDetails = null
      try {
        const errorJson = JSON.parse(responseText)
        errorMessage = errorJson.error || errorJson.message || errorMessage
        errorDetails = errorJson.insertionErrors || errorJson.details
        console.error('에러 상세:', errorJson)
        
        // 삽입 오류 상세가 있으면 메시지에 포함
        if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
          const firstError = errorDetails[0]
          if (firstError.error) {
            errorMessage += `\n\n상세: ${firstError.error}`
          }
          if (firstError.code) {
            errorMessage += `\n코드: ${firstError.code}`
          }
          if (firstError.details) {
            errorMessage += `\n세부사항: ${firstError.details}`
          }
          if (firstError.hint) {
            errorMessage += `\n힌트: ${firstError.hint}`
          }
        }
      } catch {
        errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
    }

    const data = JSON.parse(responseText)
    console.log('통계 계산 성공:', data)

    if (!data) {
      throw new Error('통계 계산 응답이 없습니다.')
    }

    alert(`통계 계산이 완료되었습니다.\n생성된 통계: ${data?.count || 0}건`)
    
    // 통계 계산 후 데이터 다시 로드
    await fetchStatistics()

  } catch (err) {
    console.error('통계 계산 오류:', err);
    console.error('에러 스택:', err.stack);
    alert('통계 계산 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    calculatingStatistics.value = false;
  }
}

function onCompanyGroupChange() {
  // 구분이 변경되면 실적 데이터 다시 로드
  if (selectedSettlementMonth.value) {
    fetchStatistics();
  }
}

function onPageChange(event) {
  currentPageFirstIndex.value = event.first;
}

// 엑셀 다운로드
async function downloadExcel() {
  if (displayRows.value.length === 0) {
    alert('다운로드할 데이터가 없습니다.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  let sheetName = '실적 상세 현황';
  if (statisticsType.value === 'company') {
    sheetName = drillDownLevel.value === 0 ? '업체별 통계' : 
                 drillDownType.value === 'hospital' ? '업체별 병원별 통계' : '업체별 제품별 통계';
  } else if (statisticsType.value === 'hospital') {
    sheetName = drillDownLevel.value === 0 ? '병원별 통계' : '병원별 제품별 통계';
  } else if (statisticsType.value === 'product') {
    sheetName = drillDownLevel.value === 0 ? '제품별 통계' : 
                 drillDownType.value === 'company' ? '제품별 업체별 통계' : '제품별 병원별 통계';
  }
  const worksheet = workbook.addWorksheet(sheetName);

  // 헤더 정의
  let headers = [];
  if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
    headers = ['No', '구분', '업체명', '사업자번호', '대표자', '처방수량', '처방액', '지급액', '흡수율'];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'hospital') {
    headers = ['No', '병의원명', '처방수량', '처방액', '제품 수'];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'product') {
    headers = ['No', '제품명', '처방수량', '처방액', '병원 수'];
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
    if (hospitalStatisticsFilter.value === 'product') {
      headers = ['No', '병의원명', '사업자등록번호', '주소', '담당업체 구분', '담당업체', '제품명', '처방수량', '처방액', '흡수율(%)'];
    } else {
      headers = ['No', '병의원명', '사업자등록번호', '주소', '담당업체 구분', '담당업체', '처방수량', '처방액', '흡수율(%)'];
    }
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 1) {
    headers = ['No', '제품명', '처방수량', '처방액'];
  } else if (statisticsType.value === 'product' && drillDownLevel.value === 0) {
    if (productStatisticsFilter.value === 'company') {
      headers = ['No', '제품명', '보험코드', '구분', '업체명', '사업자등록번호', '대표자', '처방수량', '처방액', '지급액'];
    } else if (productStatisticsFilter.value === 'hospital') {
      headers = ['No', '제품명', '보험코드', '병의원명', '사업자등록번호', '주소', '처방수량', '처방액', '지급액'];
    } else {
      headers = ['No', '제품명', '보험코드', '약가', '처방수량', '처방액', '흡수율(%)'];
    }
  } else if (statisticsType.value === 'product' && drillDownType.value === 'company') {
    headers = ['No', '업체명', '처방수량', '처방액'];
  } else if (statisticsType.value === 'product' && drillDownType.value === 'hospital') {
    headers = ['No', '병의원명', '처방수량', '처방액'];
  }

  worksheet.addRow(headers);

  // 헤더 스타일
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '76933C' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // 데이터 추가
  displayRows.value.forEach((row, index) => {
    let rowData = [];
    if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
      rowData = [
        index + 1,
        row.company_group || '',
        row.company_name || '',
        row.business_registration_number || '',
        row.representative_name || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0,
        Number(row.payment_amount) || 0,
        row.absorption_rate !== null && row.absorption_rate !== undefined ? (Number(row.absorption_rate) * 100).toFixed(1) + '%' : '-'
      ];
    } else if (statisticsType.value === 'company' && drillDownType.value === 'hospital') {
      rowData = [
        index + 1,
        row.hospital_name || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0,
        row.product_count || 0
      ];
    } else if (statisticsType.value === 'company' && drillDownType.value === 'product') {
      rowData = [
        index + 1,
        row.product_name || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0,
        row.hospital_count || 0
      ];
    } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
      if (hospitalStatisticsFilter.value === 'product') {
        rowData = [
          index + 1,
          row.hospital_name || '',
          row.business_registration_number || '',
          row.address || '',
          row.company_groups || '',
          row.company_names || '',
          row.product_name || '',
          Number(row.prescription_qty) || 0,
          Number(row.prescription_amount) || 0,
          row.absorption_rate !== null && row.absorption_rate !== undefined ? (Number(row.absorption_rate) * 100).toFixed(1) + '%' : '-'
        ];
      } else {
        rowData = [
          index + 1,
          row.hospital_name || '',
          row.business_registration_number || '',
          row.address || '',
          row.company_groups || '',
          row.company_names || '',
          Number(row.prescription_qty) || 0,
          Number(row.prescription_amount) || 0,
          row.absorption_rate !== null && row.absorption_rate !== undefined ? (Number(row.absorption_rate) * 100).toFixed(1) + '%' : '-'
        ];
      }
    } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 1) {
      rowData = [
        index + 1,
        row.product_name || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0
      ];
    } else if (statisticsType.value === 'product' && drillDownLevel.value === 0) {
      if (productStatisticsFilter.value === 'company') {
        rowData = [
          index + 1,
          row.product_name || '',
          row.insurance_code || '',
          row.company_group || '',
          row.company_name || '',
          row.business_registration_number || '',
          row.representative_name || '',
          Number(row.prescription_qty) || 0,
          Number(row.prescription_amount) || 0,
          Number(row.payment_amount) || 0
        ];
      } else if (productStatisticsFilter.value === 'hospital') {
        rowData = [
          index + 1,
          row.product_name || '',
          row.insurance_code || '',
          row.hospital_name || '',
          row.business_registration_number || '',
          row.address || '',
          Number(row.prescription_qty) || 0,
          Number(row.prescription_amount) || 0,
          Number(row.payment_amount) || 0
        ];
      } else {
        rowData = [
          index + 1,
          row.product_name || '',
          row.insurance_code || '',
          Number(row.price) || 0,
          Number(row.prescription_qty) || 0,
          Number(row.prescription_amount) || 0,
          row.absorption_rate !== null && row.absorption_rate !== undefined ? (Number(row.absorption_rate) * 100).toFixed(1) + '%' : '-'
        ];
      }
    } else if (statisticsType.value === 'product' && drillDownType.value === 'company') {
      rowData = [
        index + 1,
        row.company_name || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0
      ];
    } else if (statisticsType.value === 'product' && drillDownType.value === 'hospital') {
      rowData = [
        index + 1,
        row.hospital_name || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0
      ];
    }

    const dataRow = worksheet.addRow(rowData);
    dataRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11 };
      cell.alignment = { vertical: 'middle' };
      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      // 구분, 사업자번호, 대표자 컬럼 (업체별 통계일 때만)
      if (statisticsType.value === 'company' && drillDownLevel.value === 0 && (colNumber === 2 || colNumber === 4 || colNumber === 5)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      // 숫자 컬럼 정렬
      let numStartCol = 3;
      if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
        numStartCol = 6; // 업체별 통계: 6번째부터 (처방수량)
      } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0 && hospitalStatisticsFilter.value === 'all') {
        numStartCol = 7; // 병원별 통계(전체): 7번째부터 (처방수량)
      } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0 && hospitalStatisticsFilter.value === 'product') {
        numStartCol = 8; // 병원별 통계(제품별): 8번째부터 (처방수량)
      }
      
      if (colNumber >= numStartCol) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (colNumber === numStartCol) {
          cell.numFmt = '#,##0.0';
        } else {
          cell.numFmt = '#,##0';
        }
      }
      
      // 병원별 통계에서 사업자등록번호, 담당업체 구분 컬럼 정렬
      if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
        if (colNumber === 3) { // 사업자등록번호
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 5) { // 담당업체 구분
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      
      // 흡수율 컬럼 정렬
      if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
        const absorptionCol = hospitalStatisticsFilter.value === 'product' ? 10 : 9;
        if (colNumber === absorptionCol) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    });
  });

  // 합계 행 추가
  let totalRowData = [];
  if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
    // 평균 흡수율 계산
    const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
    const totalPaymentAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);
    const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalPaymentAmount / totalPrescriptionAmount) : 0;
    
    totalRowData = ['합계', '', '', '', '', 
      Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
      Number(totalAmount.value.replace(/,/g, '')),
      Number(totalPaymentAmount.value.replace(/,/g, '')),
      (avgAbsorptionRate * 100).toFixed(1) + '%'
    ];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'hospital') {
    totalRowData = ['합계', '', 
      Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
      Number(totalAmount.value.replace(/,/g, '')),
      totalProductCount.value
    ];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'product') {
    totalRowData = ['합계', '', 
      Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
      Number(totalAmount.value.replace(/,/g, '')),
      totalHospitalCount.value
    ];
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
    // 평균 흡수율 계산
    const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
    const totalPaymentAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);
    const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalPaymentAmount / totalPrescriptionAmount) : 0;
    
    if (hospitalStatisticsFilter.value === 'product') {
      totalRowData = ['합계', '', '', '', '', '', 
        Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
        Number(totalAmount.value.replace(/,/g, '')),
        (avgAbsorptionRate * 100).toFixed(1) + '%'
      ];
    } else {
      totalRowData = ['합계', '', '', '', '', 
        Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
        Number(totalAmount.value.replace(/,/g, '')),
        (avgAbsorptionRate * 100).toFixed(1) + '%'
      ];
    }
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 1) {
    totalRowData = ['합계', '', 
      Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
      Number(totalAmount.value.replace(/,/g, ''))
    ];
  } else if (statisticsType.value === 'product' && drillDownLevel.value === 0) {
    if (productStatisticsFilter.value === 'company') {
      totalRowData = ['합계', '', '', '', '', '', 
        Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
        Number(totalAmount.value.replace(/,/g, '')),
        Number(totalPaymentAmount.value.replace(/,/g, ''))
      ];
    } else if (productStatisticsFilter.value === 'hospital') {
      totalRowData = ['합계', '', '', '', '', '', 
        Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
        Number(totalAmount.value.replace(/,/g, '')),
        Number(totalPaymentAmount.value.replace(/,/g, ''))
      ];
    } else {
      const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
      const totalPaymentAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);
      const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalPaymentAmount / totalPrescriptionAmount) : 0;
      totalRowData = ['합계', '', '', 
        Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
        Number(totalAmount.value.replace(/,/g, '')),
        (avgAbsorptionRate * 100).toFixed(1) + '%'
      ];
    }
  } else if (statisticsType.value === 'product' && drillDownType.value === 'company') {
    totalRowData = ['합계', '', 
      Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
      Number(totalAmount.value.replace(/,/g, ''))
    ];
  } else if (statisticsType.value === 'product' && drillDownType.value === 'hospital') {
    totalRowData = ['합계', '', 
      Number(totalQty.value.replace(/,/g, '').replace('.0', '')),
      Number(totalAmount.value.replace(/,/g, ''))
    ];
  }
  const totalRow = worksheet.addRow(totalRowData);
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };
    cell.alignment = { vertical: 'middle' };
    if (colNumber === 1) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    // 구분, 사업자번호, 대표자 컬럼 (업체별 통계일 때만)
    if (statisticsType.value === 'company' && drillDownLevel.value === 0 && (colNumber === 2 || colNumber === 4 || colNumber === 5)) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    // 흡수율 컬럼 (업체별 통계일 때만)
    if (statisticsType.value === 'company' && drillDownLevel.value === 0 && colNumber === 9) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    // 숫자 컬럼 정렬
    let numStartCol = 3;
    if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
      numStartCol = 6; // 업체별 통계: 6번째부터 (처방수량)
    } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0 && hospitalStatisticsFilter.value === 'all') {
        numStartCol = 7; // 병원별 통계(전체): 7번째부터 (처방수량)
      } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0 && hospitalStatisticsFilter.value === 'product') {
        numStartCol = 8; // 병원별 통계(제품별): 8번째부터 (처방수량)
    }
    
    if (colNumber >= numStartCol) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
    
    // 병원별 통계에서 사업자등록번호, 담당업체 구분 컬럼 정렬
    if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
      if (colNumber === 3) { // 사업자등록번호
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 5) { // 담당업체 구분
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
    
    // 흡수율 컬럼 정렬
    if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
      const absorptionCol = hospitalStatisticsFilter.value === 'product' ? 10 : 9;
      if (colNumber === absorptionCol) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  });

  // 컬럼 너비 설정
  worksheet.columns = headers.map(() => ({ width: 20 }));

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const monthInfo = selectedSettlementMonth.value ? formatMonthToKorean(selectedSettlementMonth.value) : null;
  link.download = generateExcelFileName('실적상세현황', monthInfo);
  link.click();
  window.URL.revokeObjectURL(url);
}

// 워치어
const stopWatch = watch(selectedSettlementMonth, () => {
  // 처방월 필터 제거됨
});

// 마운트
onMounted(async () => {
  isMounted.value = true;
  await fetchAvailableMonths();
  await fetchAllCompanies();
  await fetchAllHospitals();
  await fetchAllProducts();
  await fetchAvailableCompanyGroups();
  if (isMounted.value) {
    if (selectedSettlementMonth.value) {
      await fetchStatistics();
    }
  }
});

// 언마운트
onUnmounted(() => {
  isMounted.value = false;
  stopWatch(); // watch 정리
});
</script>

<style scoped>
.performance-detail-view {
  padding: 0px;
}

.data-card-buttons {
  display: flex;
  gap: 8px;
}

.btn-back {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  background-color: #e0e0e0;
}

/* 검색 드롭다운 스타일 */
.company-search-container,
.hospital-search-container,
.product-search-container {
  position: relative;
}

.company-dropdown,
.hospital-dropdown,
.product-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.company-dropdown-item,
.hospital-dropdown-item,
.product-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.company-dropdown-item:hover,
.hospital-dropdown-item:hover,
.product-dropdown-item:hover {
  background-color: #f5f5f5;
}

.company-dropdown-item.selected,
.hospital-dropdown-item.selected,
.product-dropdown-item.selected {
  background-color: #e3f2fd;
  color: #1976d2;
}

.company-dropdown-item.highlighted,
.hospital-dropdown-item.highlighted,
.product-dropdown-item.highlighted {
  background-color: #f0f8ff;
  color: #1976d2;
}

:deep(.p-datatable-tbody > tr > td) {
  background: #ffffff !important;
}

:deep(.p-datatable-tfoot > tr > td) {
  background: #f8f9fa !important;
  font-weight: bold;
}
</style>

