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
          <button 
            class="btn-excell-download" 
            @click="validateData" 
            :disabled="displayRows.length === 0"
            style="margin-right: 8px;"
            title="데이터 정확성 검증"
          >
            데이터 검증
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
          sortMode="single"
          :removableSort="true"
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
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column field="payment_amount" header="지급액" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.payment_amount) }}
              </template>
            </Column>
            <Column field="direct_revenue" header="직거래매출" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.direct_revenue) }}
              </template>
            </Column>
            <Column field="wholesale_revenue" header="도매매출" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.wholesale_revenue) }}
              </template>
            </Column>
            <Column field="total_revenue" header="매출액" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.total_revenue) }}
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
                <Column :footer="totalDirectRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalWholesaleRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
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
            <Column field="total_revenue" header="매출액" :headerStyle="{ width: '8%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.total_revenue) }}
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
                <Column :footer="totalRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
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
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column field="total_revenue" header="매출액" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.total_revenue) }}
              </template>
            </Column>
            <!-- 전체 필터일 때 흡수율 표시 -->
            <Column v-if="productStatisticsFilter === 'all'" field="absorption_rate" header="흡수율(%)" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatAbsorptionRate(slotProps.data.absorption_rate) }}
              </template>
            </Column>
            <!-- 업체별, 병의원별 필터일 때 지급액 표시 -->
            <Column v-if="productStatisticsFilter === 'company' || productStatisticsFilter === 'hospital'" field="payment_amount" header="지급액" :headerStyle="{ width: '9%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.payment_amount) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="productStatisticsFilter === 'all' ? 4 : productStatisticsFilter === 'company' ? 7 : 6" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
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
            <Column field="company_name" header="업체명" :headerStyle="{ width: '25%' }" :sortable="true" />
            <Column field="prescription_qty" header="처방수량" :headerStyle="{ width: '15%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_qty, true) }}
              </template>
            </Column>
            <Column field="prescription_amount" header="처방액" :headerStyle="{ width: '15%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.prescription_amount) }}
              </template>
            </Column>
            <Column field="total_revenue" header="매출액" :headerStyle="{ width: '15%' }" :sortable="true" :bodyStyle="{ textAlign: 'right' }">
              <template #body="slotProps">
                {{ formatNumber(slotProps.data.total_revenue) }}
              </template>
            </Column>
            <Column field="absorption_rate" header="흡수율" :headerStyle="{ width: '15%' }" :sortable="true" :bodyStyle="{ textAlign: 'center' }">
              <template #body="slotProps">
                {{ formatAbsorptionRate(slotProps.data.absorption_rate) }}
              </template>
            </Column>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="합계" :colspan="2" footerClass="footer-cell" footerStyle="text-align:center !important;" />
                <Column :footer="totalQty" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalRevenue" footerClass="footer-cell" footerStyle="text-align:right !important;" />
                <Column :footer="totalAbsorptionRate" footerClass="footer-cell" footerStyle="text-align:center !important;" />
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
    <div v-if="loading || calculatingStatistics" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">
          {{ calculatingStatistics ? '통계를 계산하는 중입니다...' : '데이터를 불러오는 중입니다...' }}
        </div>
        <div v-if="calculatingStatistics" class="loading-subtext">
          이 작업은 시간이 걸릴 수 있습니다. 잠시만 기다려주세요.
        </div>
      </div>
    </div>
    
    
    <!-- 데이터 검증 결과 모달 -->
    <Dialog 
      v-model:visible="showValidationResultModal" 
      :modal="true" 
      :closable="true"
      :draggable="false"
      :style="{ width: '600px', maxWidth: '90vw' }"
      class="validation-result-dialog"
      @update:visible="(val) => showValidationResultModal = val"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-left">
            <div class="dialog-icon-wrapper" :class="validationResult.isValid ? 'success' : 'warning'">
              <i :class="validationResult.isValid ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
            </div>
            <div class="dialog-title-message">
              <strong>검증 결과</strong>
            </div>
          </div>
        </div>
      </template>
      
      <div class="dialog-content">
        <div class="validation-summary" :class="validationResult.isValid ? 'success' : 'warning'">
          <p>{{ validationResult.summary }}</p>
        </div>
        
        <div v-if="validationResult.details.length > 0" class="validation-details">
          <div class="details-header">
            <strong>발견된 문제:</strong>
          </div>
          <div class="details-list">
            <div 
              v-for="(detail, index) in validationResult.details" 
              :key="index"
              class="detail-item"
            >
              <i class="pi pi-circle-fill"></i>
              <span>{{ detail }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="확인" 
          icon="pi pi-check" 
          @click="showValidationResultModal = false"
          class="p-button-primary"
        />
      </template>
    </Dialog>
    
    <!-- 통계 계산 확인 모달 -->
    <Dialog 
      v-model:visible="showStatisticsConfirmModal" 
      :modal="true" 
      :closable="false"
      :draggable="false"
      :style="{ width: '500px' }"
      class="statistics-confirm-dialog"
      @update:visible="(val) => showStatisticsConfirmModal = val"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-left">
            <div class="dialog-icon-wrapper">
              <i class="pi pi-calculator"></i>
            </div>
            <div class="dialog-title-message">
              <strong>{{ selectedSettlementMonth }}</strong> 정산월의 통계를 계산하시겠습니까?
            </div>
          </div>
          <button 
            class="dialog-close-button"
            @click="showStatisticsConfirmModal = false"
            aria-label="닫기"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </template>
      
      <div class="dialog-content">
        <div class="dialog-message">
          <div class="message-details">
            <div class="detail-item">
              <i class="pi pi-info-circle"></i>
              <span>업체 + 병원 + 제품 조합별로 처방수량과 처방액 합계를 저장합니다.</span>
            </div>
            <div class="detail-item">
              <i class="pi pi-clock"></i>
              <span>이 작업은 시간이 걸릴 수 있습니다.</span>
            </div>
          </div>
        </div>
        
        <div class="dialog-warning">
          <i class="pi pi-exclamation-triangle"></i>
          <span>기존 통계 데이터는 삭제되고 새로 계산된 데이터로 대체됩니다.</span>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button 
            label="취소" 
            icon="pi pi-times" 
            @click="showStatisticsConfirmModal = false"
            class="p-button-text p-button-secondary"
            :style="{ marginRight: '8px' }"
          />
          <Button 
            label="계산 시작" 
            icon="pi pi-check" 
            @click="handleConfirmStatistics"
            class="p-button-primary"
            :loading="calculatingStatistics"
          />
        </div>
      </template>
    </Dialog>
    
    <!-- 통계 계산 완료 모달 -->
    <Dialog 
      v-model:visible="showStatisticsCompleteModal" 
      :modal="true" 
      :closable="true"
      :draggable="false"
      :style="{ width: '550px' }"
      class="statistics-complete-dialog"
      @update:visible="(val) => showStatisticsCompleteModal = val"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-left">
            <div class="dialog-icon-wrapper success">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="dialog-title-message">
              <strong>통계 계산 완료</strong>
            </div>
          </div>
          <button 
            class="dialog-close-button"
            @click="showStatisticsCompleteModal = false"
            aria-label="닫기"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </template>
      
      <div class="dialog-content">
        <div class="dialog-message">
          <div class="success-message">
            <p><strong>{{ statisticsResult.settlement_month }}</strong> 정산월의 통계 계산이 완료되었습니다.</p>
          </div>
          
          <div class="statistics-summary">
            <div class="summary-item">
              <div class="summary-label">
                <i class="pi pi-database"></i>
                <span>총 저장된 조합</span>
              </div>
              <div class="summary-value">
                <strong>{{ formatNumber(statisticsResult.count, true) }}건</strong>
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">
                <i class="pi pi-info-circle"></i>
                <span>조합 기준</span>
              </div>
              <div class="summary-value">
                <span>업체 + 병원 + 제품</span>
              </div>
            </div>
            <div class="summary-item" v-if="statisticsResult.inserted > 0 || statisticsResult.updated > 0">
              <div class="summary-label">
                <i class="pi pi-sync"></i>
                <span>처리 내역</span>
              </div>
              <div class="summary-value">
                <span v-if="statisticsResult.inserted > 0">신규: {{ formatNumber(statisticsResult.inserted, true) }}건</span>
                <span v-if="statisticsResult.inserted > 0 && statisticsResult.updated > 0">, </span>
                <span v-if="statisticsResult.updated > 0">수정: {{ formatNumber(statisticsResult.updated, true) }}건</span>
              </div>
            </div>
          </div>
          
          <div class="dialog-info">
            <div class="info-item">
              <i class="pi pi-check-circle"></i>
              <span>매출 데이터는 흡수율 분석과 동일한 방식으로 계산되었습니다.</span>
            </div>
            <div class="info-item">
              <i class="pi pi-check-circle"></i>
              <span>처방월 기준으로 매출 테이블에서 데이터를 가져와 분배 계산했습니다.</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <Button 
            label="확인" 
            icon="pi pi-check" 
            @click="showStatisticsCompleteModal = false"
            class="p-button-primary"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// 디바운스 유틸리티 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { supabase } from '@/supabase';
import ExcelJS from 'exceljs';
import { generateExcelFileName, formatMonthToKorean } from '@/utils/excelUtils';
import { formatNumber, formatAbsorptionRate, formatBusinessNumber } from '@/utils/formatUtils';
import { validateAbsorptionRate, validateTotals, validateDataIntegrity, detectOutliers } from '@/utils/statisticsValidation';
import { useNotifications } from '@/utils/notifications';

// Props
const props = defineProps({
  fixedStatisticsType: {
    type: String,
    default: null, // null이면 선택 가능, 'company', 'hospital', 'product' 중 하나면 고정
    validator: (value) => value === null || ['company', 'hospital', 'product'].includes(value)
  }
});

// Toast 및 Confirm 서비스
const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotifications();

// 통계 계산 확인 모달
const showStatisticsConfirmModal = ref(false);
const showStatisticsCompleteModal = ref(false);
const statisticsResult = ref({
  count: 0,
  settlement_month: '',
  inserted: 0,
  updated: 0
});

// 데이터 검증 결과 모달
const showValidationResultModal = ref(false);
const validationResult = ref({
  isValid: true,
  issues: [],
  summary: '',
  details: []
});

// 개발 모드 체크
const isDevelopment = import.meta.env.DEV;

// 개발용 로그 함수
const devLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

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
const forceRealTimeCalculation = ref(false); // 통계 갱신 버튼을 눌렀을 때 실시간 계산 강제

// 표시할 데이터
const displayRows = computed(() => {
  return statisticsData.value;
});

// 합계 계산 (성능 최적화: 한 번의 순회로 모든 합계 계산)
const totals = computed(() => {
  let qty = 0;
  let amount = 0;
  let paymentAmount = 0;
  let directRevenue = 0;
  let wholesaleRevenue = 0;
  let totalRevenue = 0; // 총 매출액
  let hospitalCount = 0;
  let productCount = 0;
  let companyCount = 0;
  
  displayRows.value.forEach(row => {
    qty += Number(row.prescription_qty) || 0;
    amount += Number(row.prescription_amount) || 0;
    paymentAmount += Number(row.payment_amount) || 0;
    directRevenue += Number(row.direct_revenue) || 0;
    wholesaleRevenue += Number(row.wholesale_revenue) || 0;
    totalRevenue += Number(row.total_revenue) || 0;
    hospitalCount += Number(row.hospital_count) || 0;
    productCount += Number(row.product_count) || 0;
    companyCount += Number(row.company_count) || 0;
  });
  
  // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
  // 매출액이 없으면 지급액 기반으로 계산 (하위 호환성)
  let absorptionRate = 0;
  if (totalRevenue > 0 && amount > 0) {
    // 매출액 기반 흡수율 계산 (올바른 방식)
    absorptionRate = totalRevenue / amount;
  } else if (amount > 0) {
    // 매출액이 없으면 지급액 기반으로 계산 (기존 방식, 하위 호환성)
    absorptionRate = paymentAmount / amount;
  }
  
  return {
    qty: formatNumber(qty, true),
    amount: formatNumber(amount),
    paymentAmount: formatNumber(paymentAmount),
    directRevenue: formatNumber(directRevenue),
    wholesaleRevenue: formatNumber(wholesaleRevenue),
    totalRevenue: formatNumber(totalRevenue),
    hospitalCount,
    productCount,
    companyCount,
    absorptionRate: amount > 0 ? formatAbsorptionRate(absorptionRate) : '-'
  };
});

const totalQty = computed(() => totals.value.qty);
const totalAmount = computed(() => totals.value.amount);
const totalPaymentAmount = computed(() => totals.value.paymentAmount);
const totalDirectRevenue = computed(() => totals.value.directRevenue);
const totalWholesaleRevenue = computed(() => totals.value.wholesaleRevenue);
const totalRevenue = computed(() => totals.value.totalRevenue);
const totalHospitalCount = computed(() => totals.value.hospitalCount);
const totalProductCount = computed(() => totals.value.productCount);
const totalCompanyCount = computed(() => totals.value.companyCount);
const totalAbsorptionRate = computed(() => totals.value.absorptionRate);

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

// 유틸리티 함수는 formatUtils.js에서 import

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
    devLog('데이터 조회 시작, 정산월:', selectedSettlementMonth.value);
    
    // 먼저 통계 테이블에서 조회 시도
    // 새로운 구조: (company_id, client_id, product_id) 조합별로 저장되어 있음
    // Supabase는 기본적으로 1000개까지만 반환하므로, 배치 처리로 모든 데이터 조회
    let statisticsDataFromTable = []
    let from = 0
    const batchSize = 1000
    let batchCount = 0
    
    while (true) {
      batchCount++
      let query = supabase
        .from('performance_statistics')
        .select('*')
        .eq('settlement_month', selectedSettlementMonth.value)
      
      // 필터 적용 (range 전에 필터 적용)
      if (selectedCompanyId.value) {
        query = query.eq('company_id', selectedCompanyId.value)
      }
      if (selectedHospitalId.value) {
        query = query.eq('client_id', selectedHospitalId.value)
      }
      if (selectedProductId.value) {
        query = query.eq('product_id', selectedProductId.value)
      }
      
      // 필터 적용 후 range 적용
      query = query
        .range(from, from + batchSize - 1)
        .order('id', { ascending: true })
      
      const { data: batchData, error: batchError } = await query
      
      if (batchError) {
        console.error(`통계 테이블 배치 ${batchCount} 조회 오류:`, batchError)
        break
      }
      
      if (!batchData || batchData.length === 0) {
        devLog(`통계 테이블 배치 ${batchCount}: 데이터 없음, 조회 종료`)
        break
      }
      
      statisticsDataFromTable = statisticsDataFromTable.concat(batchData)
      devLog(`통계 테이블 배치 ${batchCount}: ${batchData.length}개 조회 (누적: ${statisticsDataFromTable.length}개)`)
      
      if (batchData.length < batchSize) {
        devLog(`통계 테이블 마지막 배치 (${batchData.length}개 < ${batchSize}개), 조회 종료`)
        break
      }
      from += batchSize
    }
    
    const statisticsError = null // 배치 조회이므로 에러는 각 배치에서 처리
    
    // 통계 테이블에 데이터가 있으면 사용 (업체별 통계일 때는 모든 업체 포함)
    // ⚠️ 주의: 통계 갱신 버튼을 누르면 실시간 계산하므로, 통계 테이블은 초기 로드 시에만 사용
    // 병원별 통계와 제품별 드릴다운, 제품별 통계에서 업체별 필터는 항상 performance_statistics 테이블 사용
    const useStatisticsTable = statisticsDataFromTable && statisticsDataFromTable.length > 0 && 
      (statisticsType.value === 'hospital' || 
       (statisticsType.value === 'product' && drillDownLevel.value === 1) ||
       (statisticsType.value === 'product' && drillDownLevel.value === 0 && productStatisticsFilter.value === 'company') ||
       (statisticsType.value === 'product' && drillDownLevel.value === 0 && productStatisticsFilter.value === 'hospital') ||
       !forceRealTimeCalculation.value);
    if (useStatisticsTable) {
      devLog('통계 테이블에서 데이터 조회 성공:', statisticsDataFromTable.length, '건');
      
      if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
        // 업체별 통계: 필터에 따라 집계 방식 변경
        if (companyStatisticsFilter.value === 'hospital') {
          // 업체 + 병의원별 통계: (company_id, client_id) 조합별로 집계
          const companyHospitalMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            // 업체 필터 적용
            if (selectedCompanyId.value && item.company_id !== selectedCompanyId.value) {
              return;
            }
            // 구분 필터 적용
            if (selectedCompanyGroup.value && item.company_group !== selectedCompanyGroup.value) {
              return;
            }
            
            const key = `${item.company_id}_${item.client_id}`;
            if (!companyHospitalMap.has(key)) {
              companyHospitalMap.set(key, {
                company_id: item.company_id,
                company_name: item.company_name || '',
                company_group: item.company_group || '',
                business_registration_number: item.business_registration_number || '',
                representative_name: item.representative_name || '',
                hospital_id: item.client_id,
                hospital_name: item.hospital_name || '',
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                total_absorption_rate: 0,
                total_prescription_amount: 0
              });
            }
            
            const companyHospital = companyHospitalMap.get(key);
            companyHospital.prescription_qty += item.prescription_qty || 0;
            companyHospital.prescription_amount += item.prescription_amount || 0;
            companyHospital.payment_amount += item.payment_amount || 0;
            companyHospital.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            companyHospital.direct_revenue += Number(item.direct_revenue) || 0;
            companyHospital.total_revenue += Number(item.total_revenue) || 0;
            companyHospital.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
            companyHospital.total_prescription_amount += item.prescription_amount || 0;
            
            // hospital_name이 없으면 현재 항목의 hospital_name으로 업데이트
            if (!companyHospital.hospital_name && item.hospital_name) {
              companyHospital.hospital_name = item.hospital_name;
            }
          });
          
          // 평균 흡수율 계산 및 배열로 변환
          let aggregatedData = Array.from(companyHospitalMap.values()).map(item => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            // 매출액이 0이면 흡수율도 0
            let absorptionRate = 0;
            if (item.total_revenue > 0 && item.prescription_amount > 0) {
              absorptionRate = item.total_revenue / item.prescription_amount;
            }
            // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
            
            const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item;
            return {
              ...cleanItem,
              absorption_rate: absorptionRate
            };
          });
          
          // hospital_name이 없는 경우 clients 테이블에서 조회하여 채우기
          const itemsWithoutHospitalName = aggregatedData.filter(item => !item.hospital_name && item.hospital_id);
          if (itemsWithoutHospitalName.length > 0) {
            const hospitalIds = itemsWithoutHospitalName.map(item => item.hospital_id);
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, name')
              .in('id', hospitalIds);
            
            if (clientsData) {
              const clientsMap = new Map(clientsData.map(c => [c.id, c]));
              aggregatedData = aggregatedData.map(item => {
                if (!item.hospital_name && item.hospital_id) {
                  const client = clientsMap.get(item.hospital_id);
                  if (client) {
                    return {
                      ...item,
                      hospital_name: client.name || ''
                    };
                  }
                }
                return item;
              });
            }
          }
          
          statisticsData.value = aggregatedData;
        } else if (companyStatisticsFilter.value === 'product') {
          // 업체 + 제품별 통계: (company_id, product_id) 조합별로 집계
          const companyProductMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            // 업체 필터 적용
            if (selectedCompanyId.value && item.company_id !== selectedCompanyId.value) {
              return;
            }
            // 구분 필터 적용
            if (selectedCompanyGroup.value && item.company_group !== selectedCompanyGroup.value) {
              return;
            }
            
            const key = `${item.company_id}_${item.product_id}`;
            if (!companyProductMap.has(key)) {
              companyProductMap.set(key, {
                company_id: item.company_id,
                company_name: item.company_name || '',
                company_group: item.company_group || '',
                business_registration_number: item.business_registration_number || '',
                representative_name: item.representative_name || '',
                product_id: item.product_id,
                product_name: item.product_name || '',
                insurance_code: item.insurance_code || '',
                price: item.price || 0,
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                total_absorption_rate: 0,
                total_prescription_amount: 0
              });
            }
            
            const companyProduct = companyProductMap.get(key);
            companyProduct.prescription_qty += item.prescription_qty || 0;
            companyProduct.prescription_amount += item.prescription_amount || 0;
            companyProduct.payment_amount += item.payment_amount || 0;
            companyProduct.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            companyProduct.direct_revenue += Number(item.direct_revenue) || 0;
            companyProduct.total_revenue += Number(item.total_revenue) || 0;
            companyProduct.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
            companyProduct.total_prescription_amount += item.prescription_amount || 0;
            
            // product_name이 없으면 현재 항목의 product_name으로 업데이트
            if (!companyProduct.product_name && item.product_name) {
              companyProduct.product_name = item.product_name;
            }
            if (!companyProduct.insurance_code && item.insurance_code) {
              companyProduct.insurance_code = item.insurance_code;
            }
          });
          
          // 평균 흡수율 계산 및 배열로 변환
          let aggregatedData = Array.from(companyProductMap.values()).map(item => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            // 매출액이 0이면 흡수율도 0
            let absorptionRate = 0;
            if (item.total_revenue > 0 && item.prescription_amount > 0) {
              absorptionRate = item.total_revenue / item.prescription_amount;
            }
            // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
            
            const { total_absorption_rate, total_prescription_amount, ...cleanItem } = item;
            return {
              ...cleanItem,
              absorption_rate: absorptionRate
            };
          });
          
          statisticsData.value = aggregatedData;
        } else {
          // 업체별 통계: company_id로 GROUP BY하여 집계
          const companyMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            // 업체 필터 적용
            if (selectedCompanyId.value && item.company_id !== selectedCompanyId.value) {
              return;
            }
            // 구분 필터 적용
            if (selectedCompanyGroup.value && item.company_group !== selectedCompanyGroup.value) {
              return;
            }
            
            const companyId = item.company_id;
            if (!companyMap.has(companyId)) {
              companyMap.set(companyId, {
                company_id: companyId,
                company_name: item.company_name,
                company_group: item.company_group,
                business_registration_number: item.business_registration_number,
                representative_name: item.representative_name,
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                total_absorption_rate: 0,
                total_prescription_amount: 0
              });
            }
            
            const company = companyMap.get(companyId);
            company.prescription_qty += item.prescription_qty || 0;
            company.prescription_amount += item.prescription_amount || 0;
            company.payment_amount += item.payment_amount || 0;
            company.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            company.direct_revenue += Number(item.direct_revenue) || 0;
            company.total_revenue += Number(item.total_revenue) || 0;
            company.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
            company.total_prescription_amount += item.prescription_amount || 0;
          });
          
          // 평균 흡수율 계산 및 배열로 변환
          let aggregatedData = Array.from(companyMap.values()).map(company => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            // 매출액이 0이면 흡수율도 0
            let absorptionRate = 0;
            if (company.total_revenue > 0 && company.prescription_amount > 0) {
              absorptionRate = company.total_revenue / company.prescription_amount;
            }
            // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
            
            const { total_absorption_rate, total_prescription_amount, ...cleanCompany } = company;
            return {
              ...cleanCompany,
              absorption_rate: absorptionRate
            };
          });
          
          // 모든 승인된 업체 조회하여 실적이 없는 업체도 포함 (업체 필터가 없을 때만)
          if (!selectedCompanyId.value) {
            const { data: allCompanies } = await supabase
              .from('companies')
              .select('id, company_name, company_group, business_registration_number, representative_name')
              .eq('approval_status', 'approved')
              .eq('status', 'active')
              .eq('user_type', 'user');
            
            if (allCompanies) {
              let filteredCompanies = allCompanies;
              if (selectedCompanyGroup.value) {
                filteredCompanies = allCompanies.filter(c => c.company_group === selectedCompanyGroup.value);
              }
              
              const existingCompanyIds = new Set(aggregatedData.map(item => item.company_id));
              const missingCompanies = filteredCompanies
                .filter(company => !existingCompanyIds.has(company.id))
                .map(company => ({
                  company_id: company.id,
                  company_name: company.company_name,
                  company_group: company.company_group || '',
                  business_registration_number: company.business_registration_number || '',
                  representative_name: company.representative_name || '',
                  prescription_qty: 0,
                  prescription_amount: 0,
                  payment_amount: 0,
                  absorption_rate: 0
                }));
              
              aggregatedData = [...aggregatedData, ...missingCompanies];
            }
          }
          
          statisticsData.value = aggregatedData;
        }
      } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
        // 병원별 통계: 필터에 따라 집계 방식 변경
        if (hospitalStatisticsFilter.value === 'product') {
          // 병원 + 제품별 통계: (client_id, product_id) 조합별로 집계
          const hospitalProductMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            const key = `${item.client_id}_${item.product_id}`;
            if (!hospitalProductMap.has(key)) {
              hospitalProductMap.set(key, {
                hospital_id: item.client_id,
                hospital_name: item.hospital_name || '',
                business_registration_number: item.hospital_business_registration_number || '',
                address: item.address || '',
                product_id: item.product_id,
                product_name: item.product_name || '',
                insurance_code: item.insurance_code || '',
                price: item.price || 0,
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                total_absorption_rate: 0,
                total_prescription_amount: 0,
                companyGroups: new Set(),
                companyNames: new Set()
              });
            }
            
            const hospitalProduct = hospitalProductMap.get(key);
            hospitalProduct.prescription_qty += item.prescription_qty || 0;
            hospitalProduct.prescription_amount += item.prescription_amount || 0;
            hospitalProduct.payment_amount += item.payment_amount || 0;
            hospitalProduct.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            hospitalProduct.direct_revenue += Number(item.direct_revenue) || 0;
            hospitalProduct.total_revenue += Number(item.total_revenue) || 0;
            hospitalProduct.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
            hospitalProduct.total_prescription_amount += item.prescription_amount || 0;
            
            // hospital_name이 없으면 현재 항목의 hospital_name으로 업데이트
            if (!hospitalProduct.hospital_name && item.hospital_name) {
              hospitalProduct.hospital_name = item.hospital_name;
            }
            if (!hospitalProduct.business_registration_number && item.hospital_business_registration_number) {
              hospitalProduct.business_registration_number = item.hospital_business_registration_number;
            }
            if (!hospitalProduct.address && item.address) {
              hospitalProduct.address = item.address;
            }
            if (!hospitalProduct.product_name && item.product_name) {
              hospitalProduct.product_name = item.product_name;
            }
            if (!hospitalProduct.insurance_code && item.insurance_code) {
              hospitalProduct.insurance_code = item.insurance_code;
            }
            
            if (item.company_group) {
              hospitalProduct.companyGroups.add(item.company_group);
            }
            if (item.company_name) {
              hospitalProduct.companyNames.add(item.company_name);
            }
          });
          
          // 평균 흡수율 계산 및 배열로 변환
          let aggregatedHospitalData = Array.from(hospitalProductMap.values()).map(item => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            // 매출액이 0이면 흡수율도 0
            let absorptionRate = 0;
            if (item.total_revenue > 0 && item.prescription_amount > 0) {
              absorptionRate = item.total_revenue / item.prescription_amount;
            }
            // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
            
            const { total_absorption_rate, total_prescription_amount, companyGroups, companyNames, ...cleanItem } = item;
            return {
              ...cleanItem,
              absorption_rate: absorptionRate,
              company_groups: Array.from(companyGroups).sort().join(', '),
              company_names: Array.from(companyNames).sort().join(', ')
            };
          });
          
          // hospital_name이나 business_registration_number가 없는 경우 clients 테이블에서 조회하여 채우기
          const hospitalsNeedingData = aggregatedHospitalData.filter(h => 
            (!h.hospital_name || !h.business_registration_number) && h.hospital_id
          );
          if (hospitalsNeedingData.length > 0) {
            const hospitalIds = hospitalsNeedingData.map(h => h.hospital_id);
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, name, business_registration_number, address')
              .in('id', hospitalIds);
            
            if (clientsData) {
              const clientsMap = new Map(clientsData.map(c => [c.id, c]));
              aggregatedHospitalData = aggregatedHospitalData.map(hospital => {
                if (hospital.hospital_id) {
                  const client = clientsMap.get(hospital.hospital_id);
                  if (client) {
                    return {
                      ...hospital,
                      hospital_name: hospital.hospital_name || client.name || '',
                      business_registration_number: hospital.business_registration_number || client.business_registration_number || '',
                      address: hospital.address || client.address || ''
                    };
                  }
                }
                return hospital;
              });
            }
          }
          
          // product_name이 없는 경우 products 테이블에서 조회하여 채우기
          const productsNeedingData = aggregatedHospitalData.filter(h => !h.product_name && h.product_id);
          if (productsNeedingData.length > 0) {
            const productIds = productsNeedingData.map(h => h.product_id);
            const { data: productsData } = await supabase
              .from('products')
              .select('id, product_name, insurance_code, price')
              .in('id', productIds);
            
            if (productsData) {
              const productsMap = new Map(productsData.map(p => [p.id, p]));
              aggregatedHospitalData = aggregatedHospitalData.map(item => {
                if (item.product_id) {
                  const product = productsMap.get(item.product_id);
                  if (product) {
                    return {
                      ...item,
                      product_name: item.product_name || product.product_name || '',
                      insurance_code: item.insurance_code || product.insurance_code || '',
                      price: item.price || product.price || 0
                    };
                  }
                }
                return item;
              });
            }
          }
          
          statisticsData.value = aggregatedHospitalData;
        } else {
          // 병원별 통계: client_id로 GROUP BY하여 집계
          const hospitalMap = new Map();
          const hospitalCompanyMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            const clientId = item.client_id;
            if (!hospitalMap.has(clientId)) {
              hospitalMap.set(clientId, {
                hospital_id: clientId,
                hospital_name: item.hospital_name || '',
                hospital_business_registration_number: item.hospital_business_registration_number || '',
                address: item.address || '',
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                total_absorption_rate: 0,
                total_prescription_amount: 0,
                companyGroups: new Set(),
                companyNames: new Set()
              });
              hospitalCompanyMap.set(clientId, {
                companyGroups: new Set(),
                companyNames: new Set()
              });
            }
            
            const hospital = hospitalMap.get(clientId);
            hospital.prescription_qty += item.prescription_qty || 0;
            hospital.prescription_amount += item.prescription_amount || 0;
            hospital.payment_amount += item.payment_amount || 0;
            hospital.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            hospital.direct_revenue += Number(item.direct_revenue) || 0;
            hospital.total_revenue += Number(item.total_revenue) || 0;
            hospital.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
            hospital.total_prescription_amount += item.prescription_amount || 0;
            
            // hospital_name이 없으면 현재 항목의 hospital_name으로 업데이트
            if (!hospital.hospital_name && item.hospital_name) {
              hospital.hospital_name = item.hospital_name;
            }
            if (!hospital.hospital_business_registration_number && item.hospital_business_registration_number) {
              hospital.hospital_business_registration_number = item.hospital_business_registration_number;
            }
            if (!hospital.address && item.address) {
              hospital.address = item.address;
            }
            
            if (item.company_group) {
              hospital.companyGroups.add(item.company_group);
            }
            if (item.company_name) {
              hospital.companyNames.add(item.company_name);
            }
          });
          
          // 평균 흡수율 계산 및 배열로 변환
          let aggregatedHospitalData = Array.from(hospitalMap.values()).map(hospital => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            // 매출액이 0이면 흡수율도 0
            let absorptionRate = 0;
            if (hospital.total_revenue > 0 && hospital.prescription_amount > 0) {
              absorptionRate = hospital.total_revenue / hospital.prescription_amount;
            }
            // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
            
            const { total_absorption_rate, total_prescription_amount, companyGroups, companyNames, hospital_business_registration_number, ...cleanHospital } = hospital;
            return {
              ...cleanHospital,
              business_registration_number: hospital_business_registration_number || '',
              absorption_rate: absorptionRate,
              company_groups: Array.from(companyGroups).sort().join(', '),
              company_names: Array.from(companyNames).sort().join(', ')
            };
          });
          
          // hospital_name이나 business_registration_number가 없는 경우 clients 테이블에서 조회하여 채우기
          const hospitalsNeedingData = aggregatedHospitalData.filter(h => 
            (!h.hospital_name || !h.business_registration_number) && h.hospital_id
          );
          if (hospitalsNeedingData.length > 0) {
            const hospitalIds = hospitalsNeedingData.map(h => h.hospital_id);
            const { data: clientsData } = await supabase
              .from('clients')
              .select('id, name, business_registration_number, address')
              .in('id', hospitalIds);
            
            if (clientsData) {
              const clientsMap = new Map(clientsData.map(c => [c.id, c]));
              aggregatedHospitalData = aggregatedHospitalData.map(hospital => {
                if (hospital.hospital_id) {
                  const client = clientsMap.get(hospital.hospital_id);
                  if (client) {
                    return {
                      ...hospital,
                      hospital_name: hospital.hospital_name || client.name || '',
                      business_registration_number: hospital.business_registration_number || client.business_registration_number || '',
                      address: hospital.address || client.address || ''
                    };
                  }
                }
                return hospital;
              });
            }
          }
          
          statisticsData.value = aggregatedHospitalData;
        }
      } else if (statisticsType.value === 'product' && drillDownLevel.value === 0) {
        // 제품별 통계: 필터에 따라 집계 방식 변경
        if (productStatisticsFilter.value === 'company') {
          // 제품 + 업체별 통계: performance_statistics 테이블 사용
          const productCompanyMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            const key = `${item.product_id}_${item.company_id}`;
            if (!productCompanyMap.has(key)) {
              productCompanyMap.set(key, {
                product_id: item.product_id,
                product_name: item.product_name || '',
                insurance_code: item.insurance_code || '',
                company_id: item.company_id,
                company_name: item.company_name || '',
                company_group: item.company_group || '',
                business_registration_number: item.business_registration_number || '',
                representative_name: item.representative_name || '',
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                absorption_rate: 0
              });
            }
            
            const productCompany = productCompanyMap.get(key);
            productCompany.prescription_qty += item.prescription_qty || 0;
            productCompany.prescription_amount += item.prescription_amount || 0;
            productCompany.payment_amount += item.payment_amount || 0;
            productCompany.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            productCompany.direct_revenue += Number(item.direct_revenue) || 0;
            productCompany.total_revenue += Number(item.total_revenue) || 0;
          });
          
          // 흡수율 계산 및 배열로 변환
          statisticsData.value = Array.from(productCompanyMap.values()).map(item => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            let absorptionRate = 0;
            if (item.total_revenue > 0 && item.prescription_amount > 0) {
              absorptionRate = item.total_revenue / item.prescription_amount;
            }
            
            return {
              ...item,
              absorption_rate: absorptionRate
            };
          });
        } else if (productStatisticsFilter.value === 'hospital') {
          // 제품 + 병의원별 통계: performance_statistics 테이블 사용
          const productHospitalMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            const key = `${item.product_id}_${item.client_id}`;
            if (!productHospitalMap.has(key)) {
              productHospitalMap.set(key, {
                product_id: item.product_id,
                product_name: item.product_name || '',
                insurance_code: item.insurance_code || '',
                hospital_id: item.client_id,
                hospital_name: item.hospital_name || '',
                business_registration_number: item.hospital_business_registration_number || '',
                address: item.address || '',
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                absorption_rate: 0
              });
            }
            
            const productHospital = productHospitalMap.get(key);
            productHospital.prescription_qty += item.prescription_qty || 0;
            productHospital.prescription_amount += item.prescription_amount || 0;
            productHospital.payment_amount += item.payment_amount || 0;
            productHospital.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            productHospital.direct_revenue += Number(item.direct_revenue) || 0;
            productHospital.total_revenue += Number(item.total_revenue) || 0;
          });
          
          // 흡수율 계산 및 배열로 변환
          statisticsData.value = Array.from(productHospitalMap.values()).map(item => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            let absorptionRate = 0;
            if (item.total_revenue > 0 && item.prescription_amount > 0) {
              absorptionRate = item.total_revenue / item.prescription_amount;
            }
            
            return {
              ...item,
              absorption_rate: absorptionRate
            };
          });
        } else {
          // 전체 (제품별만): product_id로 GROUP BY하여 집계
          const productMap = new Map();
          
          statisticsDataFromTable.forEach(item => {
            const productId = item.product_id;
            if (!productMap.has(productId)) {
              productMap.set(productId, {
                product_id: productId,
                product_name: item.product_name,
                insurance_code: item.insurance_code,
                price: item.price,
                prescription_qty: 0,
                prescription_amount: 0,
                payment_amount: 0,
                wholesale_revenue: 0,
                direct_revenue: 0,
                total_revenue: 0,
                total_absorption_rate: 0,
                total_prescription_amount: 0
              });
            }
            
            const product = productMap.get(productId);
            product.prescription_qty += item.prescription_qty || 0;
            product.prescription_amount += item.prescription_amount || 0;
            product.payment_amount += item.payment_amount || 0;
            product.wholesale_revenue += Number(item.wholesale_revenue) || 0;
            product.direct_revenue += Number(item.direct_revenue) || 0;
            product.total_revenue += Number(item.total_revenue) || 0;
            product.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
            product.total_prescription_amount += item.prescription_amount || 0;
          });
          
          // 평균 흡수율 계산 및 배열로 변환
          statisticsData.value = Array.from(productMap.values()).map(product => {
            // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
            // 매출액이 0이면 흡수율도 0
            let absorptionRate = 0;
            if (product.total_revenue > 0 && product.prescription_amount > 0) {
              absorptionRate = product.total_revenue / product.prescription_amount;
            }
            // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
            
            const { total_absorption_rate, total_prescription_amount, ...cleanProduct } = product;
            return {
              ...cleanProduct,
              absorption_rate: absorptionRate
            };
          });
        }
      } else if (statisticsType.value === 'product' && drillDownLevel.value === 1 && drillDownType.value === 'company') {
        // 제품 → 업체별 드릴다운: 해당 제품의 업체별 집계
        const productId = drillDownData.value?.product_id;
        if (!productId) {
          statisticsData.value = [];
          loading.value = false;
          return;
        }
        
        const companyMap = new Map();
        
        statisticsDataFromTable.forEach(item => {
          // 해당 제품의 데이터만 필터링
          if (item.product_id !== productId) return;
          
          const companyId = item.company_id;
          if (!companyMap.has(companyId)) {
            companyMap.set(companyId, {
              company_id: companyId,
              company_name: item.company_name || '',
              company_group: item.company_group || '',
              business_registration_number: item.business_registration_number || '',
              representative_name: item.representative_name || '',
              prescription_qty: 0,
              prescription_amount: 0,
              payment_amount: 0,
              wholesale_revenue: 0,
              direct_revenue: 0,
              total_revenue: 0,
              total_absorption_rate: 0,
              total_prescription_amount: 0
            });
          }
          
          const company = companyMap.get(companyId);
          company.prescription_qty += item.prescription_qty || 0;
          company.prescription_amount += item.prescription_amount || 0;
          company.payment_amount += item.payment_amount || 0;
          company.wholesale_revenue += Number(item.wholesale_revenue) || 0;
          company.direct_revenue += Number(item.direct_revenue) || 0;
          company.total_revenue += Number(item.total_revenue) || 0;
          company.total_absorption_rate += (item.prescription_amount || 0) * (item.absorption_rate || 0);
          company.total_prescription_amount += item.prescription_amount || 0;
        });
        
        // 평균 흡수율 계산 및 배열로 변환
        statisticsData.value = Array.from(companyMap.values()).map(company => {
          // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
          // 매출액이 0이면 흡수율도 0
          let absorptionRate = 0;
          if (company.total_revenue > 0 && company.prescription_amount > 0) {
            absorptionRate = company.total_revenue / company.prescription_amount;
          }
          // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
          
          const { total_absorption_rate, total_prescription_amount, ...cleanCompany } = company;
          return {
            ...cleanCompany,
            absorption_rate: absorptionRate
          };
        });
      } else {
        statisticsData.value = statisticsDataFromTable;
      }
      
      loading.value = false;
      return;
    }
    
    // 통계 테이블에 데이터가 없으면 빈 배열로 설정 (데이터 없음 표시)
    devLog('통계 테이블에 데이터가 없습니다. 통계 갱신이 필요합니다.');
    statisticsData.value = [];
    loading.value = false;
    return;

  } catch (err) {
    // 컴포넌트가 언마운트되었으면 에러 표시하지 않음
    if (!isMounted.value) {
      return;
    }
    console.error('통계 데이터 조회 예외:', err);
    showError('데이터 조회 중 오류가 발생했습니다: ' + (err.message || err));
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
  
  devLog('aggregateByCompany 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
    // 실적 검수 방식: 삭제 처리된 건 제외
    if (record.review_action === '삭제') return;
    // 실적 검수 방식: 완료 상태만 포함 (이미 쿼리에서 필터링됨)
    
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
        total_revenue: 0,
        total_absorption_rate: 0,
        total_prescription_amount: 0
      });
    }

    const item = map.get(companyId);
    item.prescription_qty += qty;
    item.prescription_amount += amount;
    item.payment_amount += paymentAmount;
    item.total_revenue += Number(record.total_revenue) || 0;
    // 흡수율 계산을 위한 누적값
    item.total_absorption_rate += amount * appliedAbsorptionRate;
    item.total_prescription_amount += amount;
    processedCount++;
    } catch (err) {
      console.error(`레코드 ${index} 처리 중 오류:`, err, record);
      skippedCount++;
    }
  });
  
  devLog(`집계 완료: 처리됨 ${processedCount}개, 건너뜀 ${skippedCount}개`);

  return Array.from(map.values()).map(item => {
    // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
    // 매출액이 0이면 흡수율도 0
    let absorptionRate = 0;
    if (item.total_revenue > 0 && item.prescription_amount > 0) {
      // 매출액 기반 흡수율 계산 (올바른 방식)
      absorptionRate = item.total_revenue / item.prescription_amount;
    }
    // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
    
    const result = {
      company_id: item.company_id,
      company_name: item.company_name,
      company_group: item.company_group,
      business_registration_number: item.business_registration_number,
      representative_name: item.representative_name,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      total_revenue: item.total_revenue,
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
        total_revenue: 0,
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
    item.total_revenue += Number(record.total_revenue) || 0;
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
    // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
    // 매출액이 0이면 흡수율도 0
    let absorptionRate = 0;
    if (item.total_revenue > 0 && item.prescription_amount > 0) {
      // 매출액 기반 흡수율 계산 (올바른 방식)
      absorptionRate = item.total_revenue / item.prescription_amount;
    }
    // 매출액이 0이면 흡수율도 0으로 설정 (지급액 기반 계산 제거)
    
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
      total_revenue: item.total_revenue,
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
        total_revenue: 0,
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
    item.total_revenue += Number(record.total_revenue) || 0;
    // 흡수율 계산을 위한 누적값
    item.total_absorption_rate += amount * appliedAbsorptionRate;
    item.total_prescription_amount += amount;
    if (companyId) item.companies.add(companyId);
    if (hospitalId) item.hospitals.add(hospitalId);
  });

  return Array.from(map.values()).map(item => {
    // 흡수율 계산: 매출액 기반 (total_revenue / prescription_amount)
    // 매출액이 0이면 흡수율도 0
    let absorptionRate = 0;
    if (item.total_revenue > 0 && item.prescription_amount > 0) {
      // 매출액 기반 흡수율 계산 (올바른 방식)
      absorptionRate = item.total_revenue / item.prescription_amount;
    }
    // 매출액이 0이면 흡수율도 0으로 설정 (가중 평균 방식 제거)
    
    const result = {
      product_id: item.product_id,
      product_name: item.product_name,
      insurance_code: item.insurance_code,
      price: item.price,
      prescription_qty: item.prescription_qty,
      prescription_amount: item.prescription_amount,
      payment_amount: item.payment_amount,
      total_revenue: item.total_revenue,
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
  
  devLog('aggregateByCompanyAndHospital 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건도 포함 (업체별 등록 현황과 동일한 조건)
      // if (record.review_action === '삭제') return;
      
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
  
  devLog('aggregateByCompanyAndProduct 시작, 입력 데이터 개수:', data.length);
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach((record, index) => {
    try {
      // 삭제 처리된 건도 포함 (업체별 등록 현황과 동일한 조건)
      // if (record.review_action === '삭제') return;
      
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
  
  devLog('aggregateByProductAndCompany 시작, 입력 데이터 개수:', data.length);
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
  
  devLog('aggregateByProductAndHospital 시작, 입력 데이터 개수:', data.length);
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
  
  devLog('aggregateByHospitalAndProduct 시작, 입력 데이터 개수:', data.length);
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
const handleCompanySearchDebounced = debounce(() => {
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
}, 300);

function handleCompanySearch() {
  // 업체 목록이 비어있으면 다시 로드 시도
  if (allCompanies.value.length === 0) {
    fetchAllCompanies().then(() => {
      // 로드 완료 후 검색 실행
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
    });
  } else {
    // 즉시 실행 (디바운스와 별도로)
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
    // 디바운스도 실행 (추가 입력 대비)
    handleCompanySearchDebounced();
  }
}

function selectCompany(company) {
  selectedCompanyId.value = company.id;
  companySearchText.value = company.id === '' ? '' : company.company_name;
  showCompanyDropdown.value = false;
  companyHighlightedIndex.value = -1;
  fetchStatistics();
}

function handleCompanyFocus() {
  // 업체 목록이 비어있으면 다시 로드 시도
  if (allCompanies.value.length === 0) {
    fetchAllCompanies().then(() => {
      handleCompanySearch();
    });
  } else {
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
const handleHospitalSearchDebounced = debounce(() => {
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
}, 300);

function handleHospitalSearch() {
  handleHospitalSearchDebounced();
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
const handleProductSearchDebounced = debounce(() => {
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
}, 300);

function handleProductSearch() {
  handleProductSearchDebounced();
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

// 통계 계산 함수 (모든 타입 한 번에 계산하여 테이블에 저장)
async function calculateStatistics() {
  if (!selectedSettlementMonth.value) {
    showWarning('정산월을 선택해주세요.');
    return;
  }

  // 커스텀 모달 표시
  showStatisticsConfirmModal.value = true;
}

// 통계 계산 확인 처리
async function handleConfirmStatistics() {
  showStatisticsConfirmModal.value = false;
  await executeCalculateStatistics();
}

async function executeCalculateStatistics() {
  if (!selectedSettlementMonth.value) {
    showWarning('정산월을 선택해주세요.');
    return;
  }

  calculatingStatistics.value = true;
  loading.value = true;

  try {
    // 통계 계산 (RPC 함수 호출) - performance_records에서 직접 데이터를 가져와서 독립적으로 동작
    const { error: statisticsError } = await supabase.rpc('calculate_statistics', {
      p_settlement_month: selectedSettlementMonth.value
    });

    if (statisticsError) {
      console.error('통계 계산 오류:', statisticsError);
      throw new Error(`통계 계산 실패: ${statisticsError.message}`);
    }

    devLog('통계 계산 완료');

    // 통계 계산 결과 저장
    const { count } = await supabase
      .from('performance_statistics')
      .select('id', { count: 'exact', head: true })
      .eq('settlement_month', selectedSettlementMonth.value);

    statisticsResult.value = {
      count: count || 0,
      settlement_month: selectedSettlementMonth.value,
      inserted: count || 0,
      updated: count || 0
    };

    // 통계 계산 후 테이블에서 데이터 다시 로드
    await fetchStatistics();

    // 통계 계산 완료 모달 표시
    showStatisticsCompleteModal.value = true;

  } catch (err) {
    console.error('통계 계산 오류:', err);
    console.error('에러 스택:', err.stack);
    showError('통계 계산 중 오류가 발생했습니다: ' + (err.message || err));
  } finally {
    calculatingStatistics.value = false;
    loading.value = false;
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

// 데이터 정확성 검증
async function validateData() {
  if (displayRows.value.length === 0) {
    showWarning('검증할 데이터가 없습니다.');
    return;
  }

  try {
    const issues = [];
    
    // 1. 흡수율 검증
    const absorptionValidation = validateAbsorptionRate(displayRows.value);
    if (!absorptionValidation.isValid) {
      issues.push({
        type: '흡수율 계산 불일치',
        message: absorptionValidation.message
      });
    }

    // 2. 합계 검증
    const totalsValidation = validateTotals(displayRows.value);
    if (!totalsValidation.isValid) {
      issues.push({
        type: '합계 불일치',
        message: totalsValidation.message
      });
    }

    // 3. 데이터 무결성 검증 (통계 타입 전달)
    const integrityValidation = validateDataIntegrity(displayRows.value, statisticsType.value);
    if (!integrityValidation.isValid) {
      issues.push(...integrityValidation.issues.map(issue => ({
        type: issue.type,
        message: issue.message
      })));
    }

    // 4. 이상치 감지
    const outliersValidation = detectOutliers(displayRows.value);
    if (!outliersValidation.isValid) {
      issues.push(...outliersValidation.outliers.map(outlier => ({
        type: outlier.type,
        message: outlier.message
      })));
    }

    // 결과 표시
    const details = issues.map(issue => `${issue.type}: ${issue.message}`);
    
    validationResult.value = {
      isValid: issues.length === 0,
      issues: issues,
      summary: issues.length === 0 
        ? '모든 데이터가 정확합니다.' 
        : `${issues.length}개의 문제가 발견되었습니다.`,
      details: details
    };
    
    showValidationResultModal.value = true;
    
    // 개발 모드에서만 상세 로그 출력
    if (isDevelopment) {
      console.group('데이터 검증 결과');
      console.log('흡수율 검증:', absorptionValidation);
      console.log('합계 검증:', totalsValidation);
      console.log('무결성 검증:', integrityValidation);
      console.log('이상치 감지:', outliersValidation);
      console.groupEnd();
    }
  } catch (err) {
    console.error('데이터 검증 오류:', err);
    showError('데이터 검증 중 오류가 발생했습니다: ' + (err.message || err));
  }
}

// 엑셀 다운로드
async function downloadExcel() {
  if (displayRows.value.length === 0) {
    showWarning('다운로드할 데이터가 없습니다.');
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
    headers = ['No', '구분', '업체명', '사업자번호', '대표자', '처방수량', '처방액', '지급액', '직거래매출', '도매매출', '매출액', '흡수율'];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'hospital') {
    headers = ['No', '병의원명', '처방수량', '처방액', '제품 수'];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'product') {
    headers = ['No', '제품명', '처방수량', '처방액', '병원 수'];
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
    headers = ['No', '병의원명', '사업자등록번호', '주소', '담당업체 구분', '담당업체', '처방수량', '처방액', '매출액', '흡수율(%)'];
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
    headers = ['No', '업체명', '처방수량', '처방액', '매출액', '흡수율(%)'];
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
        Number(row.direct_revenue) || 0,
        Number(row.wholesale_revenue) || 0,
        Number(row.total_revenue) || 0,
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
      // 병원별 통계: hospital_business_registration_number 사용
      rowData = [
        index + 1,
        row.hospital_name || '',
        row.hospital_business_registration_number || row.business_registration_number || '',
        row.address || '',
        row.company_groups || '',
        row.company_names || '',
        Number(row.prescription_qty) || 0,
        Number(row.prescription_amount) || 0,
        Number(row.total_revenue) || 0,
        row.absorption_rate !== null && row.absorption_rate !== undefined ? (Number(row.absorption_rate) * 100).toFixed(1) + '%' : '-'
      ];
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
        Number(row.prescription_amount) || 0,
        Number(row.total_revenue) || 0,
        row.absorption_rate !== null && row.absorption_rate !== undefined ? (Number(row.absorption_rate) * 100).toFixed(1) + '%' : '-'
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
      } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
        numStartCol = 7; // 병원별 통계: 7번째부터 (처방수량)
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
        const absorptionCol = 10; // 병원별 통계: 10번째 컬럼 (흡수율, 매출액 추가로 변경)
        if (colNumber === absorptionCol) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      // 제품 → 업체별 드릴다운 흡수율 컬럼 정렬
      if (statisticsType.value === 'product' && drillDownType.value === 'company') {
        const absorptionCol = 6; // 제품 → 업체별: 6번째 컬럼 (흡수율)
        if (colNumber === absorptionCol) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    });
  });

  // 합계 행 추가
  let totalRowData = [];
  if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
    // 평균 흡수율 계산 (매출액 기반)
    const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
    const totalRevenue = displayRows.value.reduce((sum, row) => sum + (Number(row.total_revenue) || 0), 0);
    const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalRevenue / totalPrescriptionAmount) : 0;
    
    totalRowData = ['합계', '', '', '', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, '')),
      Number((totalPaymentAmount.value || '0').toString().replace(/,/g, '')),
      Number((totalDirectRevenue.value || '0').toString().replace(/,/g, '')),
      Number((totalWholesaleRevenue.value || '0').toString().replace(/,/g, '')),
      Number((totalRevenue.value || '0').toString().replace(/,/g, '')),
      (avgAbsorptionRate * 100).toFixed(1) + '%'
    ];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'hospital') {
    totalRowData = ['합계', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, '')),
      totalProductCount.value || 0
    ];
  } else if (statisticsType.value === 'company' && drillDownType.value === 'product') {
    totalRowData = ['합계', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, '')),
      totalHospitalCount.value || 0
    ];
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
    // 평균 흡수율 계산 (매출액 기반)
    const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
    const totalRevenue = displayRows.value.reduce((sum, row) => sum + (Number(row.total_revenue) || 0), 0);
    const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalRevenue / totalPrescriptionAmount) : 0;
    
    totalRowData = ['합계', '', '', '', '', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, '')),
      Number((totalRevenue.value || '0').toString().replace(/,/g, '')),
      (avgAbsorptionRate * 100).toFixed(1) + '%'
    ];
  } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 1) {
    totalRowData = ['합계', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, ''))
    ];
  } else if (statisticsType.value === 'product' && drillDownLevel.value === 0) {
    if (productStatisticsFilter.value === 'company') {
      totalRowData = ['합계', '', '', '', '', '', 
        Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
        Number((totalAmount.value || '0').toString().replace(/,/g, '')),
        Number((totalPaymentAmount.value || '0').toString().replace(/,/g, ''))
      ];
    } else if (productStatisticsFilter.value === 'hospital') {
      totalRowData = ['합계', '', '', '', '', '', 
        Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
        Number((totalAmount.value || '0').toString().replace(/,/g, '')),
        Number((totalPaymentAmount.value || '0').toString().replace(/,/g, ''))
      ];
    } else {
      const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
      const totalPaymentAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.payment_amount) || 0), 0);
      const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalPaymentAmount / totalPrescriptionAmount) : 0;
      totalRowData = ['합계', '', '', 
        Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
        Number((totalAmount.value || '0').toString().replace(/,/g, '')),
        (avgAbsorptionRate * 100).toFixed(1) + '%'
      ];
    }
  } else if (statisticsType.value === 'product' && drillDownType.value === 'company') {
    // 평균 흡수율 계산 (매출액 기반)
    const totalPrescriptionAmount = displayRows.value.reduce((sum, row) => sum + (Number(row.prescription_amount) || 0), 0);
    const totalRevenue = displayRows.value.reduce((sum, row) => sum + (Number(row.total_revenue) || 0), 0);
    const avgAbsorptionRate = totalPrescriptionAmount > 0 ? (totalRevenue / totalPrescriptionAmount) : 0;
    
    totalRowData = ['합계', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, '')),
      Number((totalRevenue.value || '0').toString().replace(/,/g, '')),
      (avgAbsorptionRate * 100).toFixed(1) + '%'
    ];
  } else if (statisticsType.value === 'product' && drillDownType.value === 'hospital') {
    totalRowData = ['합계', '', 
      Number((totalQty.value || '0').toString().replace(/,/g, '').replace('.0', '')),
      Number((totalAmount.value || '0').toString().replace(/,/g, ''))
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
    // 흡수율 컬럼 (업체별 통계일 때만) - 직거래매출·도매매출 추가로 12번째 컬럼
    if (statisticsType.value === 'company' && drillDownLevel.value === 0 && colNumber === 12) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    // 숫자 컬럼 정렬
    let numStartCol = 3;
    if (statisticsType.value === 'company' && drillDownLevel.value === 0) {
      numStartCol = 6; // 업체별 통계: 6번째부터 (처방수량)
    } else if (statisticsType.value === 'hospital' && drillDownLevel.value === 0) {
      numStartCol = 7; // 병원별 통계: 7번째부터 (처방수량)
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
      const absorptionCol = 10; // 병원별 통계: 10번째 컬럼 (흡수율, 매출액 추가로 변경)
      if (colNumber === absorptionCol) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
    // 제품 → 업체별 드릴다운 흡수율 컬럼 정렬
    if (statisticsType.value === 'product' && drillDownType.value === 'company') {
      const absorptionCol = 6; // 제품 → 업체별: 6번째 컬럼 (흡수율)
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

/* 정렬 상태 시각화 개선 */
:deep(.p-datatable-thead > tr > th.p-sortable-column) {
  cursor: pointer;
  user-select: none;
}

:deep(.p-datatable-thead > tr > th.p-sortable-column:hover) {
  background-color: #f5f5f5;
}

:deep(.p-datatable-thead > tr > th.p-sortable-column.p-highlight) {
  background-color: #e3f2fd;
  color: #1976d2;
}

:deep(.p-datatable-thead > tr > th.p-sortable-column.p-highlight:hover) {
  background-color: #bbdefb;
}

/* 테이블 행 호버 효과 개선 */
:deep(.p-datatable-tbody > tr:hover > td) {
  background-color: #f5f5f5 !important;
  transition: background-color 0.2s;
}

/* 테이블 헤더 스타일 개선 */
:deep(.p-datatable-thead > tr > th) {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  padding: 12px;
}

/* 로딩 오버레이 스타일 개선 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  min-width: 300px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.loading-subtext {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

/* 통계 계산 확인 모달 스타일 */
:deep(.statistics-confirm-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.statistics-confirm-dialog .p-dialog-header) {
  padding: 0 !important;
  background: #ffffff !important;
  border: none !important;
  border-radius: 0 !important;
  border-bottom: 1px solid #e9ecef !important;
}

:deep(.statistics-confirm-dialog .p-dialog-header .p-dialog-header-icon) {
  display: none !important;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  color: #333;
  width: 100%;
  background: #ffffff;
}

.dialog-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.dialog-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.dialog-icon-wrapper i {
  font-size: 24px;
  color: white;
}

.dialog-title-message {
  font-size: 17px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  flex: 1;
}

.dialog-title-message strong {
  font-size: 19px;
  font-weight: 700;
  color: #667eea;
}

.dialog-close-button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.dialog-close-button:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  color: #495057;
  transform: scale(1.1);
}

.dialog-close-button:active {
  transform: scale(0.95);
}

.dialog-close-button i {
  font-size: 18px;
  color: inherit;
}

:deep(.statistics-confirm-dialog .p-dialog-content) {
  padding: 0 24px 28px 24px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 0;
}

.dialog-message {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 0;
}

.message-main {
  font-size: 17px;
  color: #333;
  line-height: 1.7;
  font-weight: 500;
  padding-bottom: 4px;
  margin-top: 0;
  padding-top: 0;
}

.message-main strong {
  color: #667eea;
  font-size: 20px;
  font-weight: 700;
}

.message-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #667eea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: #495057;
  line-height: 1.6;
}

.detail-item i {
  color: #667eea;
  margin-top: 3px;
  flex-shrink: 0;
  font-size: 16px;
}

.dialog-warning {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  background: #fff3cd;
  border-radius: 10px;
  border-left: 4px solid #ffc107;
  font-size: 14px;
  color: #856404;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dialog-warning i {
  color: #ffc107;
  font-size: 20px;
  margin-top: 2px;
  flex-shrink: 0;
}

:deep(.statistics-confirm-dialog .p-dialog-footer) {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

:deep(.statistics-confirm-dialog .p-button) {
  min-width: 120px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 15px;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.statistics-confirm-dialog .p-button-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: 2px solid transparent !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
}

:deep(.statistics-confirm-dialog .p-button-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
}

:deep(.statistics-confirm-dialog .p-button-primary:active) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
}

:deep(.statistics-confirm-dialog .p-button-secondary) {
  background: white !important;
  color: #6c757d !important;
  border: 2px solid #dee2e6 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
}

:deep(.statistics-confirm-dialog .p-button-secondary:hover) {
  background: #f8f9fa !important;
  border-color: #adb5bd !important;
  color: #495057 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12) !important;
}

:deep(.statistics-confirm-dialog .p-button-secondary:active) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

:deep(.statistics-confirm-dialog .p-button .p-button-icon) {
  font-size: 16px;
}

:deep(.statistics-confirm-dialog .p-button-label) {
  font-weight: 600;
}

/* 데이터 검증 결과 모달 스타일 */
.validation-result-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.validation-result-dialog .dialog-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.validation-result-dialog .dialog-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.validation-result-dialog .dialog-icon-wrapper.success {
  background-color: #d4edda;
  color: #155724;
}

.validation-result-dialog .dialog-icon-wrapper.warning {
  background-color: #fff3cd;
  color: #856404;
}

.validation-result-dialog .dialog-title-message {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.validation-result-dialog .dialog-content {
  padding: 24px;
}

.validation-result-dialog .validation-summary {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
}

.validation-result-dialog .validation-summary.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.validation-result-dialog .validation-summary.warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.validation-result-dialog .validation-details {
  margin-top: 20px;
}

.validation-result-dialog .details-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #212529;
}

.validation-result-dialog .details-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.validation-result-dialog .detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
}

.validation-result-dialog .detail-item i {
  color: #dc3545;
  font-size: 6px;
  margin-top: 8px;
  flex-shrink: 0;
}

.validation-result-dialog .detail-item span {
  flex: 1;
  word-break: break-word;
}

:deep(.validation-result-dialog .p-dialog-footer) {
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

:deep(.validation-result-dialog .p-button) {
  min-width: 100px;
  padding: 10px 20px;
}

/* 통계 계산 완료 모달 스타일 */
:deep(.statistics-complete-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.statistics-complete-dialog .p-dialog-header) {
  padding: 0 !important;
  background: #ffffff !important;
  border: none !important;
  border-radius: 0 !important;
  border-bottom: 1px solid #e9ecef !important;
}

:deep(.statistics-complete-dialog .p-dialog-content) {
  padding: 0 24px 28px 24px;
}

.dialog-icon-wrapper.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.success-message {
  padding: 16px;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  margin-bottom: 20px;
}

.success-message p {
  margin: 0;
  font-size: 16px;
  color: #155724;
  line-height: 1.6;
}

.statistics-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e9ecef;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6c757d;
}

.summary-label i {
  font-size: 16px;
  color: #667eea;
}

.summary-value {
  font-size: 15px;
  color: #212529;
  font-weight: 500;
}

.summary-value strong {
  font-size: 18px;
  color: #667eea;
  font-weight: 700;
}

.dialog-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #e7f3ff;
  border-radius: 8px;
  border: 1px solid #b3d9ff;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #004085;
  line-height: 1.6;
}

.info-item i {
  font-size: 16px;
  color: #0066cc;
  margin-top: 2px;
  flex-shrink: 0;
}

:deep(.statistics-complete-dialog .p-dialog-footer) {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
}

:deep(.statistics-complete-dialog .p-button-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: 2px solid transparent !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
  min-width: 120px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 15px;
  border-radius: 8px;
}

:deep(.statistics-complete-dialog .p-button-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
}
</style>

