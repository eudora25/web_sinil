<template>
  <div class="performance-review-view page-container" style="display: flex; flex-direction: column; height: 100vh;">
    <div class="page-header-title-area" style="flex-shrink: 0;">
      <div class="header-title">실적 검수</div>
    </div>

    <!-- 필터 카드 -->
    <div class="filter-card" style="flex-shrink: 0;" :class="{ 'disabled-area': isAnyEditing }">
      <div class="filter-row" style="justify-content: flex-start; align-items: flex-end;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>정산월</label>
          <select v-model="selectedSettlementMonth" class="select_month">
            <option v-for="month in availableMonths" :key="month.settlement_month" :value="month.settlement_month">{{ month.settlement_month }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>처방월</label>
          <select v-model="prescriptionOffset" class="select_month">
            <option v-for="opt in prescriptionOptions" :key="opt.value" :value="opt.value">{{ opt.month }}</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>업체</label>
          <div class="company-search-container" style="position: relative;">
            <input
              v-model="companySearchText"
              @input="handleCompanySearch"
              @focus="handleCompanyFocus"
              @blur="delayedHideCompanyDropdown"
              @keydown="handleCompanyKeydown"
              :placeholder="selectedCompanyId === null || selectedCompanyId === '' ? '업체명을 입력하세요...' : ''"
              class="select_200px"
              autocomplete="off"
            />
            <div v-if="showCompanyDropdown && filteredCompanies.length > 0" class="company-dropdown">
              <!-- 전체 옵션 -->
              <div
                :class="['company-dropdown-item', { 
                  selected: selectedCompanyId === null || selectedCompanyId === '', 
                  highlighted: companyHighlightedIndex === 0 
                }]"
                @mousedown.prevent="selectCompany({ id: null, company_name: '전체' })"
              >
                전체
              </div>
              <!-- 업체 목록 -->
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
            <div v-if="showCompanyDropdown && filteredCompanies.length === 0 && companySearchText.trim()" class="company-dropdown">
              <div class="company-dropdown-item no-results">검색 결과가 없습니다</div>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>병의원</label>
          <div class="hospital-search-container" style="position: relative;">
            <input
              v-model="hospitalSearchText"
              @input="handleHospitalSearch"
              @focus="handleHospitalFocus"
              @blur="delayedHideHospitalDropdown"
              @keydown="handleHospitalKeydown"
              :placeholder="selectedHospitalId === null ? '병의원명을 입력하세요...' : ''"
              class="select_240px"
              autocomplete="off"
            />
            <div v-if="showHospitalDropdown && filteredHospitals.length > 0" class="hospital-dropdown">
              <!-- 전체 옵션 -->
              <div
                :class="['hospital-dropdown-item', { 
                  selected: selectedHospitalId === null, 
                  highlighted: hospitalHighlightedIndex === 0 
                }]"
                @mousedown.prevent="selectHospital({ id: null, name: '전체' })"
              >
                전체
              </div>
              <!-- 병의원 목록 -->
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
            <div v-if="showHospitalDropdown && filteredHospitals.length === 0 && hospitalSearchText.trim()" class="hospital-dropdown">
              <div class="hospital-dropdown-item no-results">검색 결과가 없습니다.</div>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label>상태</label>
          <select v-model="selectedStatus" class="select_100px">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

      </div>
    </div>

    <!-- 데이터 카드 -->
    <div class="data-card" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
      <div class="data-card-header" style="flex-shrink: 0;">
        <div class="total-count-display">전체 {{ displayRows.length }} 건</div>
        <div v-if="selectedHospitalRemarks && selectedHospitalId" 
          class="settlement-remarks" 
          style="background: #e3f2fd; 
          color: #1976d2; 
          padding: 0.25rem 1rem;
          max-width: 500px;
          min-width: 240px;
          text-align: left;
          border-radius: 4px; 
          border: 1px solid #bbdefb; 
          font-size: 0.9rem; 
          font-weight: 500;
          margin-left: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: help;
          title: selectedHospitalRemarks;">
          {{ selectedHospitalRemarks }}
        </div>
        <div class="data-card-buttons" style="margin-left: auto;">
           <button class="btn-check" @click="checkPromotionStatistics" :disabled="checkingStatistics || isAnyEditing" style="margin-right: 1rem;">
             {{ checkingStatistics ? '업데이트 중...' : '프로모션 데이터 업데이트' }}
           </button>
           <button class="btn-primary" @click="changeReviewStatus" :disabled="!selectedRows || selectedRows.length === 0 || isAnyEditing" style="margin-right: 1rem;">
             검수 상태 변경 ({{ selectedRows.length }}건)
           </button>
           <button class="btn-primary" @click="openBulkChangeModal" :disabled="!selectedRows || selectedRows.length === 0 || isAnyEditing">
             일괄 변경 ({{ selectedRows.length }}건)
           </button>
        </div>
      </div>

      <div style="flex-grow: 1; overflow: hidden;">
        <DataTable
          :value="displayRows"
          :loading="false"
          v-model:editingRows="editingRows"
          editMode="row"
          @row-edit-save="onRowEditSave"
          :rowClass="getRowClass"
          paginator
          :rows="rowsPerPage"
          :rowsPerPageOptions="[50, 100, 200, 500]"
          scrollable
          scrollHeight="calc(100vh - 240px)"
          class="admin-performance-review-table"
          dataKey="id"
          v-model:first="currentPageFirstIndex"
          @page="onPageChange"
          :pt="{
            wrapper: { style: 'min-width: 2600px;' },
            table: { style: 'min-width: 2600px;' }
          }"
        >
          <template #empty>
            <div v-if="!loading">해당 정산월의 실적 데이터가 없습니다.</div>
          </template>

          <Column header="No" :headerStyle="{ width: columnWidths.no }" :frozen="true">
            <template #body="slotProps">{{ slotProps.index + currentPageFirstIndex + 1 }}</template>
          </Column>

          <Column header="상태" field="display_status" :headerStyle="{ width: columnWidths.review_status }" :frozen="true">
            <template #body="slotProps">
              <Tag :value="slotProps.data.display_status" :severity="getStatusSeverity(slotProps.data.display_status)"/>
            </template>
          </Column>

          <Column header="작업" field="review_action" :headerStyle="{ width: columnWidths.review_action }" :frozen="true">
            <template #body="slotProps">
              <Tag v-if="slotProps.data.review_action" :value="slotProps.data.review_action" :severity="getActionSeverity(slotProps.data.review_action)"/>
            </template>
          </Column>

          <Column header="액션" :headerStyle="{ width: columnWidths.actions }" :frozen="true">
             <template #body="slotProps">
              <div style="display: flex; gap: 4px; justify-content: center;">
                <template v-if="slotProps.data.isEditing">
                  <button class="btn-save-sm" @click="saveEdit(slotProps.data)" title="저장">✓</button>
                  <button class="btn-cancel-sm" @click="cancelEdit(slotProps.data)" title="취소">✕</button>
                </template>
                <template v-else-if="slotProps.data.review_action === '삭제'">
                  <button class="btn-restore-sm" @click="restoreRow(slotProps.data)" title="되돌리기" :disabled="isAnyEditing">↶</button>
                </template>
                <template v-else>
                  <button class="btn-edit-sm" @click="startEdit(slotProps.data)" title="수정" :disabled="slotProps.data.display_status === '완료' || isAnyEditing">✎</button>
                  <button class="btn-delete-sm" @click="confirmDeleteRow(slotProps.data)" title="삭제" :disabled="slotProps.data.display_status === '완료' || isAnyEditing">－</button>
                  <button class="btn-add-sm" @click="addRowBelow(slotProps.data)" title="추가" :disabled="isAnyEditing">＋</button>
                </template>
              </div>
            </template>
          </Column>

          <Column field="company_name" header="업체명" :headerStyle="{ width: columnWidths.company_name }" :sortable="true" />
          <Column field="client_name" header="병의원명" :headerStyle="{ width: columnWidths.client_name }" :sortable="true" />

          <Column field="prescription_month" header="처방월" :headerStyle="{ width: columnWidths.prescription_month }" :sortable="true">
            <template #body="slotProps">
              <select v-if="slotProps.data.isEditing"
                      v-model="slotProps.data.prescription_month_modify"
                      class="edit-mode-input"
              >
                <option v-for="month in prescriptionMonthOptionsForEdit" :key="month" :value="month">{{ month }}</option>
              </select>
              <span v-else>{{ slotProps.data.prescription_month }}</span>
            </template>
          </Column>
          <Column field="product_name_display" header="제품명" :headerStyle="{ width: columnWidths.product_name_display }" :sortable="true"  :frozen="true">
            <template #body="slotProps">
              <template v-if="slotProps.data.isEditing">
                <div class="product-input-container">
                  <input
                    v-model="slotProps.data.product_name_search"
                    @input="handleProductNameInput(slotProps.data, $event)"
                    @focus="handleProductNameFocus(slotProps.data)"
                    @blur="delayedHideProductSearchList(slotProps.data)"
                    :ref="el => setProductInputRef(slotProps.data.id, el)"
                    autocomplete="off"
                    class="edit-mode-input"
                  />
                  <teleport to="body">
                    <div v-if="slotProps.data.showProductSearchList"
                      class="product-search-list"
                      :style="slotProps.data.productDropdownStyle"
                    >
                      <div
                        v-for="(product, idx) in slotProps.data.productSearchResults"
                        :key="product.id"
                        :class="['product-search-item', { selected: idx === slotProps.data.productSearchSelectedIndex }]"
                        @mousedown.prevent="applySelectedProduct(product, slotProps.data)"
                      >
                        {{ product.product_name }} ({{ product.insurance_code }})
                      </div>
                    </div>
                  </teleport>
                </div>
              </template>
              <template v-else>
                <span>{{ slotProps.data.product_name_display }}</span>
              </template>
            </template>
          </Column>
          <Column field="insurance_code" header="보험코드" :headerStyle="{ width: columnWidths.insurance_code }" :sortable="true" />
          <Column field="price" header="약가" :headerStyle="{ width: columnWidths.price }" :sortable="true">
            <template #body="slotProps">
                <span v-if="slotProps.data.isEditing">{{ slotProps.data.price_for_calc?.toLocaleString() }}</span>
                <span v-else>{{ slotProps.data.price }}</span>
            </template>
          </Column>
          <Column field="prescription_qty" header="수량" :headerStyle="{ width: columnWidths.prescription_qty }" :sortable="true">
            <template #body="slotProps">
              <input
                v-if="slotProps.data.isEditing"
                v-model="slotProps.data.prescription_qty_modify"
                type="number"
                class="edit-mode-input"
                @change="handleEditCalculations(slotProps.data, 'qty')"
              />
              <span v-else>{{ Number(slotProps.data.prescription_qty).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}</span>
            </template>
          </Column>
          <Column field="prescription_amount" header="처방액" :headerStyle="{ width: columnWidths.prescription_amount }" :sortable="true">
            <template #body="slotProps">
              <span v-if="slotProps.data.isEditing">{{ slotProps.data.prescription_amount_modify?.toLocaleString() }}</span>
              <span v-else>{{ slotProps.data.prescription_amount }}</span>
            </template>
          </Column>
          <Column field="payment_prescription_amount" header="지급 처방액" :headerStyle="{ width: columnWidths.payment_prescription_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <span v-if="slotProps.data.isEditing">{{ slotProps.data.payment_prescription_amount_modify?.toLocaleString() }}</span>
              <span v-else>{{ slotProps.data.payment_prescription_amount }}</span>
            </template>
          </Column>

          <Column :headerStyle="{ width: columnWidths.checkbox, textAlign: 'center' }" :frozen="true">
            <template #header>
              <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleAllSelection"
                  class="share-checkbox"
                />
              </div>
            </template>
            <template #body="slotProps">
              <div style="display: flex; justify-content: center; align-items: center;">
                <input
                  type="checkbox"
                  :checked="selectedRows.includes(slotProps.data)"
                  :disabled="slotProps.data.review_action === '삭제'"
                  @change="toggleRowSelection(slotProps.data)"
                  class="share-checkbox"
                />
              </div>
            </template>
          </Column>

          <Column field="prescription_type" header="처방구분" :headerStyle="{ width: columnWidths.prescription_type }" :sortable="true">
            <template #body="slotProps">
              <select
                v-if="slotProps.data.isEditing"
                v-model="slotProps.data.prescription_type_modify"
                class="edit-mode-input"
              >
                <option v-for="type in prescriptionTypeOptions" :key="type" :value="type">{{ type }}</option>
              </select>
              <span v-else>{{ slotProps.data.prescription_type }}</span>
            </template>
          </Column>
          <Column field="commission_rate" header="수수료율" :headerStyle="{ width: columnWidths.commission_rate }" :sortable="true">
            <template #body="slotProps">
              <input
                v-if="slotProps.data.isEditing"
                v-model="slotProps.data.commission_rate_modify"
                type="text"
                class="edit-mode-input"
                placeholder="예: 5, 5%, 0.05"
                @input="handleCommissionRateInput(slotProps.data)"
                @change="handleEditCalculations(slotProps.data, 'rate')"
              />
              <span v-else>{{ (() => {
                const rate = slotProps.data.commission_rate;
                if (rate === null || rate === undefined) return '';
                return `${(rate * 100).toFixed(1)}%`;
              })() }}</span>
            </template>
          </Column>
          <Column field="payment_amount" header="지급액" :headerStyle="{ width: columnWidths.payment_amount }" :bodyStyle="{ textAlign: 'right !important' }" :sortable="true">
            <template #body="slotProps">
              <span v-if="slotProps.data.isEditing">{{ slotProps.data.payment_amount_modify?.toLocaleString() }}</span>
              <span v-else>{{ slotProps.data.payment_amount }}</span>
            </template>
          </Column>
          <Column field="remarks" header="비고" :headerStyle="{ width: columnWidths.remarks }" :sortable="true">
            <template #body="slotProps">
              <input
                v-if="slotProps.data.isEditing"
                v-model="slotProps.data.remarks_modify"
                class="edit-mode-input"
              />
              <span v-else>{{ slotProps.data.remarks }}</span>
            </template>
          </Column>
          <Column field="created_at" header="등록일시" :headerStyle="{ width: columnWidths.created_date }" :sortable="true">
            <template #body="slotProps">
              {{ formatDateTime(slotProps.data.created_at) }}
            </template>
          </Column>
          <Column field="registered_by_name" header="등록자" :headerStyle="{ width: columnWidths.created_by }" :sortable="true" />
          <Column field="updated_at" header="수정일시" :headerStyle="{ width: columnWidths.updated_date }" :sortable="true">
            <template #body="slotProps">
              {{ slotProps.data.updated_at ? formatDateTime(slotProps.data.updated_at) : '' }}
            </template>
          </Column>
          <Column field="updated_by_name" header="수정자" :headerStyle="{ width: columnWidths.updated_by }" :sortable="true" />

          <ColumnGroup type="footer">
            <Row>
              <Column footer="합계" :colspan="4" footerClass="footer-cell" footerStyle="text-align:center;" :frozen="true" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" :frozen="true" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column :footer="totalQuantity" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column :footer="totalPaymentPrescriptionAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footer="" footerClass="footer-cell" :frozen="true" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column :footer="totalPaymentAmount" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footer="" footerClass="footer-cell" />
              <Column :footer="totalActualPayment" footerClass="footer-cell" footerStyle="text-align:right !important;" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
              <Column footer="" footerClass="footer-cell" />
            </Row>
          </ColumnGroup>
        </DataTable>
      </div>
    </div>
  </div>

  <!-- 일괄 변경 항목 선택 모달 -->
  <div v-if="showBulkChangeModal" class="modal-mask" style="position: fixed; z-index: 9999; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
    <div class="modal-dialog" style="background: #fff; border-radius: 8px; padding: 32px 24px; min-width: 320px; box-shadow: 0 2px 16px rgba(0,0,0,0.15);">
      <div style="font-size: 1.1em; margin-bottom: 16px;">일괄 변경할 항목을 선택해주세요.</div>
      <select v-model="selectedBulkChangeType" style="width: 100%; margin-bottom: 24px; padding: 8px; font-size: 1em;">
        <option value="">- 선택 -</option>
        <option value="company_name">업체명</option>
        <option value="prescription_type">처방구분</option>
      </select>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn-primary" @click="openBulkChangeValueModal" :disabled="!selectedBulkChangeType">확인</button>
        <button class="btn-secondary" @click="closeBulkChangeModal">취소</button>
      </div>
    </div>
  </div>

  <!-- 일괄 변경 값 선택 모달 -->
  <div v-if="showBulkChangeValueModal" class="modal-mask" style="position: fixed; z-index: 9999; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
    <div class="modal-dialog" style="background: #fff; border-radius: 8px; padding: 32px 24px; min-width: 320px; box-shadow: 0 2px 16px rgba(0,0,0,0.15);">
      <div style="font-size: 1.1em; margin-bottom: 16px;">일괄 변경할 {{ getBulkChangeTypeLabel() }}을 선택해주세요.</div>
      <select v-model="selectedBulkChangeValue" style="width: 100%; margin-bottom: 24px; padding: 8px; font-size: 1em;">
        <option value="">- 선택 -</option>
        <option v-for="option in bulkChangeOptions" :key="option" :value="option">{{ option }}</option>
      </select>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn-primary" @click="handleBulkChange">확인</button>
        <button class="btn-secondary" @click="closeBulkChangeValueModal">취소</button>
      </div>
    </div>
  </div>

  <!-- 검수 상태 변경 모달 -->
  <div v-if="showStatusChangeModal" class="modal-mask" style="position: fixed; z-index: 9999; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
    <div class="modal-dialog" style="background: #fff; border-radius: 8px; padding: 32px 24px; min-width: 320px; box-shadow: 0 2px 16px rgba(0,0,0,0.15);">
      <div style="font-size: 1.1em; margin-bottom: 16px;">변경할 검수 상태를 선택해주세요.</div>
      <div style="margin-bottom: 16px; color: #666; font-size: 0.9em;">
        선택된 항목: {{ selectedRows.length }}건
      </div>
      <select v-model="selectedNewStatus" style="width: 100%; margin-bottom: 24px; padding: 8px; font-size: 1em;">
        <option value="">- 상태 선택 -</option>
        <option v-for="option in statusChangeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn-primary" @click="confirmStatusChange" :disabled="!selectedNewStatus">확인</button>
        <button class="btn-secondary" @click="cancelStatusChange">취소</button>
      </div>
    </div>
  </div>

  <!-- 전체 화면 로딩 오버레이 - 메뉴 진입 시 -->
  <div v-if="loading" class="loading-overlay">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">목록을 불러오는 중입니다...</div>
    </div>
  </div>

  <!-- 데이터 업데이트 진행 모달 -->
  <Dialog 
    v-model:visible="showStatisticsModal" 
    header="프로모션 데이터 업데이트 진행 중" 
    :modal="true"
    :closable="false"
    :style="{ width: '550px' }"
  >
    <div style="display: flex; flex-direction: column; gap: 20px; padding: 8px;">
      <!-- 진행 상황 섹션 -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-weight: 600; font-size: 1.1em; color: #333;">진행 상황</div>
          <div style="font-weight: 600; font-size: 1.2em; color: #007bff;">
            {{ statisticsProgress }}%
          </div>
        </div>
        
        <!-- 그래픽 프로그레스 바 -->
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div 
              class="progress-bar-fill" 
              :style="{ width: statisticsProgress + '%' }"
            >
              <div class="progress-bar-shine"></div>
            </div>
          </div>
          <div class="progress-steps">
            <div 
              v-for="step in 10" 
              :key="step"
              class="progress-step"
              :class="{ 'active': (step * 10) <= statisticsProgress }"
            ></div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 12px; color: #6c757d; font-size: 0.95em; font-weight: 500;">
          {{ statisticsCurrentIndex }} / {{ statisticsTotalCount }} 제품 처리 중
        </div>
      </div>

      <!-- 현재 처리 중인 제품 -->
      <div v-if="statisticsCurrentProduct" class="info-card product-card">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <i class="pi pi-box" style="color: #007bff; font-size: 1.2em;"></i>
          <div style="font-weight: 600; color: #333;">현재 처리 중인 제품</div>
        </div>
        <div style="color: #495057; font-size: 1.05em; padding-left: 28px;">{{ statisticsCurrentProduct }}</div>
      </div>

      <!-- 상태 정보 -->
      <div v-if="statisticsStatus" class="info-card status-card">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <i class="pi pi-info-circle" style="color: #17a2b8; font-size: 1.2em;"></i>
          <div style="font-weight: 600; color: #333;">상태</div>
        </div>
        <div style="color: #495057; padding-left: 28px;">{{ statisticsStatus }}</div>
      </div>

      <!-- 진행 애니메이션 -->
      <div v-if="!statisticsCompleted" class="loading-indicator">
        <div class="spinner"></div>
        <span style="margin-left: 12px; color: #6c757d;">처리 중...</span>
      </div>
    </div>
    <template #footer>
      <Button 
        v-if="statisticsCompleted" 
        label="확인" 
        icon="pi pi-check" 
        @click="closeStatisticsModal"
        class="p-button-success"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/supabase';
// 주석: updatePromotionProductHospitalPerformance는 트리거가 자동 처리하므로 불필요
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import { v4 as uuidv4 } from 'uuid';
import { convertCommissionRateToDecimal } from '@/utils/formatUtils';
import { useNotifications } from '@/utils/notifications';

const { showSuccess, showError, showWarning, showInfo, showConfirm } = useNotifications();

// --- 고정 변수 ---
const columnWidths = {
  no: '3%',
  review_status: '3%',
  review_action: '3%',
  actions: '6%',
  company_name: '8%',
  client_name: '14%',
  prescription_month: '5%',
  product_name_display: '12%',
  insurance_code: '5%',
  price: '5%',
  prescription_qty: '5%',
  prescription_amount: '6%',
  payment_prescription_amount: '6%',
  checkbox: '3%',
  prescription_type: '6%',
  commission_rate: '5%',
  payment_amount: '6%',
  remarks: '10%',
  created_date: '7%',
  created_by: '8%',
  updated_date: '7%',
  updated_by: '8%'
};
const prescriptionTypeOptions = ['EDI', 'ERP직거래자료', '매출자료', '약국조제', '원내매출', '원외매출', '차감'];

// --- 합계 계산 (개선된 버전) ---
const totalQuantity = computed(() => {
  const total = displayRows.value
    .filter(row => row.review_action !== '삭제') // 삭제 항목 제외
    .reduce((sum, row) => sum + (row._raw_prescription_qty || 0), 0);
  return total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
});

const totalPrescriptionAmount = computed(() => {
  const total = displayRows.value
    .filter(row => row.review_action !== '삭제') // 삭제 항목 제외
    .reduce((sum, row) => sum + (row._raw_prescription_amount || 0), 0);
  return total.toLocaleString();
});

const totalPaymentPrescriptionAmount = computed(() => {
  const total = displayRows.value
    .filter(row => row.review_action !== '삭제') // 삭제 항목 제외
    .reduce((sum, row) => sum + (row._raw_payment_prescription_amount || 0), 0);
  return total.toLocaleString();
});

const totalPaymentAmount = computed(() => {
  const total = displayRows.value
    .filter(row => row.review_action !== '삭제') // 삭제 항목 제외
    .reduce((sum, row) => sum + (row._raw_payment_amount || 0), 0);
  return total.toLocaleString();
});

const totalActualPayment = computed(() => {
  const total = displayRows.value
    .filter(row => row.review_action !== '삭제') // 삭제 항목 제외
    .reduce((sum, row) => sum + (row._raw_final_payment_amount || 0), 0);
  return total.toLocaleString();
});

// 구간수수료율 합계는 표시하지 않음
// const totalSectionCommission = computed(() => {
//   const total = displayRows.value
//     .filter(row => row.review_action !== '삭제') // 삭제 항목 제외
//     .reduce((sum, row) => sum + (Number(String(row.section_commission || 0).replace(/,/g, '')) || 0), 0);
//   return total.toLocaleString();
// });



// --- 기존 데이터 및 필터 변수들 ---
const availableMonths = ref([]);
const selectedSettlementMonth = ref('');
const prescriptionOffset = ref(null);
const selectedCompanyId = ref(null);
const selectedHospitalId = ref(null);

// 선택된 병의원의 정산 비고 정보
const selectedHospitalRemarks = ref('');

const statusOptions = ref([
  { value: null, label: '- 전체 -' },
  { value: '완료', label: '완료' },
  { value: '검수중', label: '검수중' },
  { value: '대기', label: '대기' },
]);
const selectedStatus = ref('검수중'); // 기본값을 검수중으로 설정

const monthlyPerformanceLinks = ref([]);
const monthlyCompanies = ref([]);
const monthlyHospitals = ref([]);
const allHospitals = ref([]); // 전체 병의원 목록
const companyHospitals = ref([]); // 선택된 업체의 병의원 목록
const hospitalSearchText = ref('');
const showHospitalDropdown = ref(false);
const filteredHospitals = ref([]);
const hospitalHighlightedIndex = ref(-1); // 병의원 드롭다운 하이라이트 인덱스

// 업체 검색 관련
const allCompanies = ref([]); // 전체 업체 목록
const companySearchText = ref(''); // 업체 검색 텍스트
const showCompanyDropdown = ref(false); // 업체 드롭다운 표시 여부
const filteredCompanies = ref([]); // 필터링된 업체 목록
const companyHighlightedIndex = ref(-1); // 업체 드롭다운 하이라이트 인덱스

// --- 상태 관리: 데이터 테이블 ---
const loading = ref(true);
const rows = ref([]);
const originalRows = ref([]);
const selectedRows = ref([]);
const activeEditingRowId = ref(null);
const editingRows = ref([]); // DataTable의 editingRows 속성용 (Array)
const products = ref([]);
const productsByMonth = ref({}); // { '2025-06': [...], '2025-05': [...], ... }
const productInputRefs = ref({});
const currentPageFirstIndex = ref(0);

// 페이지당 행 수를 ref로 정의 (기본값을 더 작게 설정하여 부하 감소)
const rowsPerPage = ref(100);

// --- 일괄 변경 모달 관련 변수 ---
const showBulkChangeModal = ref(false);
const showBulkChangeValueModal = ref(false);
const selectedBulkChangeType = ref('');
const selectedBulkChangeValue = ref('');

// --- 검수 상태 변경 모달 관련 변수 ---
const showStatusChangeModal = ref(false);
const selectedNewStatus = ref('');
const statusChangeOptions = ref([
  { value: '대기', label: '대기' },
  { value: '검수중', label: '검수중' },
  { value: '완료', label: '완료' }
]);

// --- 프로모션 데이터 업데이트 관련 변수 ---
const checkingStatistics = ref(false);
const showStatisticsModal = ref(false);
const statisticsProgress = ref(0);
const statisticsCurrentIndex = ref(0);
const statisticsTotalCount = ref(0);
const statisticsCurrentProduct = ref('');
const statisticsStatus = ref('');
const statisticsCompleted = ref(false);
const promotionProducts = ref([]);

// --- Computed 속성 ---
const isAnyEditing = computed(() => activeEditingRowId.value !== null);

// --- 헤더 체크박스 상태 관리 ---
const isAllSelected = computed(() => {
  if (displayRows.value.length === 0) return false;

  // 현재 페이지의 행만 고려
  const startIndex = currentPageFirstIndex.value;
  const endIndex = startIndex + rowsPerPage.value;

  // 현재 페이지에 표시되는 행만 필터링
  const currentPageRows = displayRows.value
  .filter((row, index) => index >= startIndex && index < endIndex && row.review_action !== '삭제');

  if (currentPageRows.length === 0) return false;
  return currentPageRows.every(row => selectedRows.value.includes(row));
});

const isIndeterminate = computed(() => {
  if (displayRows.value.length === 0) return false;

  // 현재 페이지의 행만 고려
  const startIndex = currentPageFirstIndex.value;
  const endIndex = startIndex + rowsPerPage.value;

  // 현재 페이지에 표시되는 행만 필터링
  const currentPageRows = displayRows.value
  .filter((row, index) => index >= startIndex && index < endIndex && row.review_action !== '삭제');

  if (currentPageRows.length === 0) return false;
  const selectedCount = currentPageRows.filter(row => selectedRows.value.includes(row)).length;
  return selectedCount > 0 && selectedCount < currentPageRows.length;
});

// --- 일괄 변경 관련 computed 속성 ---
const bulkChangeOptions = computed(() => {
  if (!selectedBulkChangeType.value) return [];

  switch (selectedBulkChangeType.value) {
    case 'company_name':
      // 전체 업체 목록 (user_type = user & approval_status = approved)
      return monthlyCompanies.value.map(company => company.company_name);
    case 'prescription_type':
      return prescriptionTypeOptions;
    default:
      return [];
  }
});

const displayRows = computed(() => {
  let filteredRows = rows.value;

  // 처방월 필터 적용
  if (prescriptionOffset.value !== null) {
    const targetPrescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
    filteredRows = filteredRows.filter(row => row.prescription_month === targetPrescriptionMonth);
  }

  return filteredRows.map(row => ({
    ...row,
    isEditing: row.id === activeEditingRowId.value,
    display_status: row.review_status
  }));
});

const prescriptionOptions = computed(() => {
  if (!selectedSettlementMonth.value) return [{ value: null, month: '전체' }];
  return [
    { value: null, month: '- 전체 -' },
    ...[1, 2, 3, 4, 5, 6].map(offset => ({
      value: offset,
      month: getPrescriptionMonth(selectedSettlementMonth.value, offset)
    }))
  ];
});

const prescriptionMonthOptionsForEdit = computed(() => {
    if (!selectedSettlementMonth.value) return [];
    // 처방월 옵션을 6개월로 제한
    return [1, 2, 3, 4, 5, 6].map(offset => getPrescriptionMonth(selectedSettlementMonth.value, offset));
});

const companyOptions = computed(() => {
    return [{ id: null, company_name: '- 전체 -' }, ...monthlyCompanies.value];
});


// --- Watchers ---
watch(selectedSettlementMonth, async (newMonth) => {
    if (newMonth) {
        await fetchFilterOptions(newMonth);
        selectedCompanyId.value = null;
        selectedHospitalId.value = null;
        companyHospitals.value = []; // 업체별 병원 목록 초기화
        // 정산월이 변경되면 자동으로 데이터 로드
        await loadPerformanceData();
    }
});

watch(selectedCompanyId, async () => {
    // 업체가 변경되면 검색 텍스트도 업데이트
    if (selectedCompanyId.value === null || selectedCompanyId.value === '') {
        companySearchText.value = '';
        companyHospitals.value = []; // 업체가 선택되지 않으면 병원 목록 초기화
    } else {
        const selectedCompany = allCompanies.value.find(c => c.id === selectedCompanyId.value);
        if (selectedCompany) {
            companySearchText.value = selectedCompany.company_name;
        }
        // 선택된 업체의 병원 목록 가져오기
        await fetchCompanyHospitals(selectedCompanyId.value);
    }
    
    // 병원 선택 초기화
    selectedHospitalId.value = null;
    hospitalSearchText.value = '';
    
    // 업체가 선택되었을 때 해당 업체의 병원 목록을 즉시 표시
    if (selectedCompanyId.value && companyHospitals.value.length > 0) {
        handleHospitalSearch();
    }
    
    // 업체가 변경되면 자동으로 데이터 로드
    if (selectedSettlementMonth.value) {
        await loadPerformanceData();
    }
});

watch(prescriptionOffset, async () => {
    if (selectedSettlementMonth.value) {
        if (prescriptionOffset.value !== null) {
            const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
            await fetchProducts(prescriptionMonth);
        } else {
            // 처방월이 "전체"인 경우 제품 목록을 불러올 필요 없음
            products.value = [];
        }
        // 처방월이 변경되면 자동으로 데이터 로드
        await loadPerformanceData();
    }
});

watch(selectedStatus, async (newStatus, oldStatus) => {
    // 상태 필터 변경 시 자동으로 편집 모드 해제
    if (activeEditingRowId.value !== null) {
      activeEditingRowId.value = null;
    }
    
    // 상태가 변경되면 자동으로 데이터 로드
    if (selectedSettlementMonth.value) {
        await loadPerformanceData();
    }
});

watch(selectedHospitalId, async () => {
    // 병의원이 변경되면 검색 텍스트도 업데이트
    if (selectedHospitalId.value === null) {
        hospitalSearchText.value = '';
        selectedHospitalRemarks.value = ''; // 비고 정보 초기화
    } else {
        const selectedHospital = allHospitals.value.find(h => h.id === selectedHospitalId.value);
        if (selectedHospital) {
            hospitalSearchText.value = selectedHospital.name;
        }
        // 선택된 병의원의 비고 정보 로드
        await loadHospitalRemarks(selectedHospitalId.value);
    }
    
    // 병의원이 변경되면 자동으로 데이터 로드
    if (selectedSettlementMonth.value) {
        await loadPerformanceData();
    }
});

// --- 병의원 검색 관련 함수들 ---
function handleHospitalFocus() {
    // 포커스 시 항상 드롭다운 표시
    const sourceHospitals = selectedCompanyId.value ? companyHospitals.value : allHospitals.value;
    if (sourceHospitals.length > 0) {
        handleHospitalSearch();
    } else if (selectedCompanyId.value) {
        // 업체가 선택되었지만 병원 목록이 아직 로드되지 않은 경우
        // 병원 목록을 다시 로드 시도
        fetchCompanyHospitals(selectedCompanyId.value).then(() => {
            if (companyHospitals.value.length > 0) {
                handleHospitalSearch();
            }
        });
    }
}

function handleHospitalSearch() {
    const searchTerm = hospitalSearchText.value.toLowerCase().trim();
    
    // 업체가 선택되었으면 해당 업체의 병원만, 아니면 전체 병원 사용
    const sourceHospitals = selectedCompanyId.value ? companyHospitals.value : allHospitals.value;
    
    if (!searchTerm) {
        // 검색어가 없으면 모든 병의원 표시 (최대 100개)
        filteredHospitals.value = sourceHospitals.slice(0, 100);
    } else {
        // 검색어가 있으면 필터링
        filteredHospitals.value = sourceHospitals
            .filter(hospital => 
                hospital.name.toLowerCase().includes(searchTerm)
            )
            .slice(0, 100); // 최대 100개로 제한
    }
    
    hospitalHighlightedIndex.value = -1; // 검색 시 하이라이트 초기화
    showHospitalDropdown.value = true;
}

function selectHospital(hospital) {
    selectedHospitalId.value = hospital.id;
    hospitalSearchText.value = hospital.id === null ? '' : hospital.name;
    showHospitalDropdown.value = false;
    hospitalHighlightedIndex.value = -1;
    // watcher가 자동으로 loadPerformanceData()를 호출함
}

// 병의원 키보드 네비게이션
function handleHospitalKeydown(event) {
  if (!showHospitalDropdown.value) return;
  
  const totalItems = filteredHospitals.value.length + 1; // +1 for "전체" option
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      hospitalHighlightedIndex.value = Math.min(hospitalHighlightedIndex.value + 1, totalItems - 1);
      scrollToHighlightedHospital();
      break;
    case 'ArrowUp':
      event.preventDefault();
      hospitalHighlightedIndex.value = Math.max(hospitalHighlightedIndex.value - 1, -1);
      scrollToHighlightedHospital();
      break;
    case 'Enter':
      event.preventDefault();
      if (hospitalHighlightedIndex.value === 0) {
        // "전체" 선택
        selectHospital({ id: null, name: '전체' });
      } else if (hospitalHighlightedIndex.value > 0) {
        // 병의원 선택
        const hospitalIndex = hospitalHighlightedIndex.value - 1;
        if (hospitalIndex < filteredHospitals.value.length) {
          selectHospital(filteredHospitals.value[hospitalIndex]);
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

// 병의원 드롭다운 스크롤 함수
function scrollToHighlightedHospital() {
  nextTick(() => {
    const dropdown = document.querySelector('.hospital-dropdown');
    if (!dropdown) return;
    
    const highlightedItem = dropdown.querySelector('.hospital-dropdown-item.highlighted');
    if (!highlightedItem) return;
    
    const dropdownRect = dropdown.getBoundingClientRect();
    const itemRect = highlightedItem.getBoundingClientRect();
    
    // 항목이 드롭다운 상단을 벗어나면 스크롤
    if (itemRect.top < dropdownRect.top) {
      highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // 항목이 드롭다운 하단을 벗어나면 스크롤
    else if (itemRect.bottom > dropdownRect.bottom) {
      highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function delayedHideHospitalDropdown() {
    setTimeout(() => {
        showHospitalDropdown.value = false;
    }, 200);
}

// === 업체 검색 관련 함수들 ===
async function fetchAllCompanies() {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, company_name, company_group, assigned_pharmacist_contact')
      .eq('user_type', 'user')
      .eq('approval_status', 'approved')
      .order('company_name', { ascending: true });

    if (error) throw error;
    
    allCompanies.value = companies || [];
  } catch (err) {
    console.error('전체 업체 목록 로딩 실패:', err);
    allCompanies.value = [];
  }
}

function handleCompanySearch() {
  const searchTerm = companySearchText.value.toLowerCase().trim();
  
  if (!searchTerm) {
    // 검색어가 없으면 모든 업체 표시 (최대 100개)
    filteredCompanies.value = allCompanies.value.slice(0, 100);
  } else {
    // 검색어가 있으면 필터링
    filteredCompanies.value = allCompanies.value
      .filter(company => 
        company.company_name.toLowerCase().includes(searchTerm)
      )
      .slice(0, 100); // 최대 100개로 제한
  }
  
  companyHighlightedIndex.value = -1; // 검색 시 하이라이트 초기화
  showCompanyDropdown.value = true;
}

function selectCompany(company) {
  selectedCompanyId.value = company.id;
  companySearchText.value = (company.id === null || company.id === '') ? '' : company.company_name;
  showCompanyDropdown.value = false;
  companyHighlightedIndex.value = -1;
  // watcher가 자동으로 loadPerformanceData()를 호출함
}

// 업체 키보드 네비게이션
function handleCompanyKeydown(event) {
  if (!showCompanyDropdown.value) return;
  
  const totalItems = filteredCompanies.value.length + 1; // +1 for "전체" option
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      companyHighlightedIndex.value = Math.min(companyHighlightedIndex.value + 1, totalItems - 1);
      scrollToHighlightedCompany();
      break;
    case 'ArrowUp':
      event.preventDefault();
      companyHighlightedIndex.value = Math.max(companyHighlightedIndex.value - 1, -1);
      scrollToHighlightedCompany();
      break;
    case 'Enter':
      event.preventDefault();
      if (companyHighlightedIndex.value === 0) {
        // "전체" 선택
        selectCompany({ id: null, company_name: '전체' });
      } else if (companyHighlightedIndex.value > 0) {
        // 업체 선택
        const companyIndex = companyHighlightedIndex.value - 1;
        if (companyIndex < filteredCompanies.value.length) {
          selectCompany(filteredCompanies.value[companyIndex]);
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

// 업체 드롭다운 스크롤 함수
function scrollToHighlightedCompany() {
  nextTick(() => {
    const dropdown = document.querySelector('.company-dropdown');
    if (!dropdown) return;
    
    const highlightedItem = dropdown.querySelector('.company-dropdown-item.highlighted');
    if (!highlightedItem) return;
    
    const dropdownRect = dropdown.getBoundingClientRect();
    const itemRect = highlightedItem.getBoundingClientRect();
    
    // 항목이 드롭다운 상단을 벗어나면 스크롤
    if (itemRect.top < dropdownRect.top) {
      highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    // 항목이 드롭다운 하단을 벗어나면 스크롤
    else if (itemRect.bottom > dropdownRect.bottom) {
      highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function handleCompanyFocus() {
  // 포커스 시 드롭다운 표시
  if (allCompanies.value.length > 0) {
    handleCompanySearch();
  }
}

function delayedHideCompanyDropdown() {
  // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
  setTimeout(() => {
    showCompanyDropdown.value = false;
  }, 200);
}

// 페이지 변경 시 선택된 행 상태 초기화
watch(currentPageFirstIndex, () => {
  // 페이지가 변경되면 선택된 행 초기화
  selectedRows.value = [];
});

// --- 라이프사이클 훅 ---
const route = useRoute();

onMounted(async () => {
  await fetchAvailableMonths();
  // 전체 업체 목록도 로드 (검색용)
  await fetchAllCompanies();
  if (availableMonths.value.length > 0) {
    selectedSettlementMonth.value = availableMonths.value[0].settlement_month;
    await fetchFilterOptions(selectedSettlementMonth.value);
  }

  // URL 쿼리 파라미터 처리
  if (route.query?.settlementMonth) {
    selectedSettlementMonth.value = route.query?.settlementMonth;
    await fetchFilterOptions(selectedSettlementMonth.value);
  }

  if (route.query?.company) {
    selectedCompanyId.value = route.query?.company;
  }

  if (route.query?.status) {
    selectedStatus.value = route.query?.status;
  }

  // 화면 진입 시 자동으로 데이터 로드
  if (selectedSettlementMonth.value) {
    await loadPerformanceData();
  }

  // 실제 선택된 처방월 값으로 fetchProducts 호출
  if (prescriptionOffset.value !== null) {
    const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
    await fetchProducts(prescriptionMonth);
  } else {
    // 처방월이 "전체"인 경우 제품 목록을 불러올 필요 없음
    products.value = [];
  }
});

// --- 데이터 로딩 함수 ---
async function fetchAvailableMonths() {
  const { data, error } = await supabase.from('settlement_months').select('settlement_month').order('settlement_month', { ascending: false });
  if (error) console.error('정산월 로딩 실패:', error);
  else availableMonths.value = data;
}


async function fetchFilterOptions(settlementMonth) {
    loading.value = true;

    // === 업체 리스트: 모든 승인된 업체를 별도로 쿼리 ===
    try {
        const { data: companies, error: compError } = await supabase
            .from('companies')
            .select('id, company_name')
            .eq('user_type', 'user')
            .eq('approval_status', 'approved')
            .order('company_name', { ascending: true });

        if (compError) {
            console.error('업체 필터 로딩 실패:', compError);
            monthlyCompanies.value = [];
        } else {
            monthlyCompanies.value = companies || [];
        }
    } catch (err) {
        console.error('업체 데이터 로딩 오류:', err);
        monthlyCompanies.value = [];
    }

    // === 전체 병의원 리스트: 모든 병의원을 별도로 쿼리 (중복 제거) ===
    try {
        const { data: hospitals, error: hospitalError } = await supabase
            .from('clients')
            .select('id, name, business_registration_number')
            .order('name', { ascending: true });

        if (hospitalError) {
            console.error('전체 병의원 로딩 실패:', hospitalError);
            allHospitals.value = [];
        } else {
            // 사업자등록번호 기준으로 중복 제거 (같은 사업자등록번호 중 가장 늦게 생성된 것만 유지)
            const uniqueHospitals = [];
            const businessNumberMap = new Map();
            
            hospitals.forEach(hospital => {
                const businessNumber = hospital.business_registration_number;
                if (!businessNumber || !businessNumberMap.has(businessNumber)) {
                    businessNumberMap.set(businessNumber, hospital);
                    uniqueHospitals.push(hospital);
                }
            });
            
            allHospitals.value = uniqueHospitals;
            
            // 같은 이름의 병의원이 있는지 확인 (디버깅용)
            const nameCounts = {};
            (hospitals || []).forEach(hospital => {
                nameCounts[hospital.name] = (nameCounts[hospital.name] || 0) + 1;
            });
            
            Object.entries(nameCounts).forEach(([name, count]) => {
                if (count > 1) {
                    const duplicates = (hospitals || []).filter(h => h.name === name);
                    duplicates.forEach(h => {
                    });
                }
            });
        }
    } catch (err) {
        console.error('병의원 데이터 로딩 오류:', err);
        allHospitals.value = [];
    }

    // === 해당 정산월에 실적이 있는 병의원만 (기존 로직 유지) ===
    let allPerformanceData = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        const { data: performanceData, error: perfError } = await supabase
            .from('performance_records')
            .select('company_id, client_id')
            .eq('settlement_month', settlementMonth)
            .range(from, from + batchSize - 1);

        if (perfError) {
            console.error('실적 기반 병의원 필터 데이터 로딩 실패:', perfError);
            break;
        }

        if (!performanceData || performanceData.length === 0) {
            break;
        }

        allPerformanceData = allPerformanceData.concat(performanceData);

        // 가져온 데이터가 batchSize보다 적으면 마지막 배치
        if (performanceData.length < batchSize) {
            break;
        }

        from += batchSize;
    }


    monthlyPerformanceLinks.value = allPerformanceData;
    const clientIds = [...new Set(allPerformanceData.map(p => p.client_id).filter(id => id))];

    if (clientIds.length > 0) {
        const { data: clients, error: clientError } = await supabase.from('clients').select('id, name').in('id', clientIds);
        if (clientError) console.error('병원 필터 로딩 실패:', clientError);
        else monthlyHospitals.value = clients.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else {
        monthlyHospitals.value = [];
    }
    loading.value = false;
}

async function fetchProductsForMonth(month) {
    // 이미 불러온 월이면 캐시 사용
    if (productsByMonth.value[month]) return;

    try {
        // 관리자용이므로 모든 제품을 표시 (업체별 할당 상태와 관계없이)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .eq('base_month', month)
            .order('product_name', { ascending: true })
            .range(0, 2999);

        if (!error && data) {
            productsByMonth.value[month] = data;
        } else {
            console.error('제품 목록 로딩 실패:', error);
            productsByMonth.value[month] = [];
        }
    } catch (err) {
        console.error('제품 데이터 로딩 오류:', err);
        productsByMonth.value[month] = [];
    }
}

// 선택된 업체의 병원 목록 가져오기
async function fetchCompanyHospitals(companyId) {
  if (!companyId) {
    companyHospitals.value = [];
    return;
  }
  
  try {
    // 해당 업체에 할당된 모든 병원 조회 (실적 유무와 관계없이)
    const { data, error } = await supabase
      .from('client_company_assignments')
      .select(`
        client_id,
        clients!inner(id, name, status)
      `)
      .eq('company_id', companyId)
      .eq('clients.status', 'active'); // 활성 상태인 병원만
    
    if (error) {
      console.error('업체별 병원 조회 오류:', error);
      companyHospitals.value = [];
      return;
    }
    
    // 중복 제거 후 병원 정보만 추출
    const uniqueHospitals = [];
    const seenIds = new Set();
    
    data?.forEach(assignment => {
      if (assignment.clients && !seenIds.has(assignment.clients.id)) {
        seenIds.add(assignment.clients.id);
        uniqueHospitals.push({
          id: assignment.clients.id,
          name: assignment.clients.name
        });
      }
    });
    
    // 이름순으로 정렬
    companyHospitals.value = uniqueHospitals.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } catch (err) {
    console.error('업체별 병원 데이터 로딩 오류:', err);
    companyHospitals.value = [];
  }
}

// 병의원 정산 비고 정보 로드 함수
async function loadHospitalRemarks(hospitalId) {
  if (!hospitalId) {
    selectedHospitalRemarks.value = '';
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('remarks_settlement')
      .eq('id', hospitalId)
      .single();
    
    if (error) {
      console.error('병의원 정산 비고 조회 오류:', error);
      selectedHospitalRemarks.value = '';
      return;
    }
    
    if (data && data.remarks_settlement) {
      selectedHospitalRemarks.value = data.remarks_settlement;
    } else {
      selectedHospitalRemarks.value = '';
    }
  } catch (err) {
    console.error('병의원 정산 비고 로드 오류:', err);
    selectedHospitalRemarks.value = '';
  }
}

// 기존 fetchProducts 함수는 호환성을 위해 유지
async function fetchProducts(prescriptionMonth) {
    if (!prescriptionMonth) {
        products.value = [];
        return;
    }
    await fetchProductsForMonth(prescriptionMonth);
    products.value = productsByMonth.value[prescriptionMonth] || [];
}

async function loadPerformanceData() {
  if (!selectedSettlementMonth.value) {
    showWarning('정산월을 선택해주세요.');
    return;
  }

  // 제품 목록 로드 - 처방월이 특정된 경우에만 제품 목록 불러오기
  if (prescriptionOffset.value !== null) {
    const prescriptionMonth = getPrescriptionMonth(selectedSettlementMonth.value, prescriptionOffset.value);
    await fetchProducts(prescriptionMonth);
  } else {
    // 처방월이 "전체"인 경우 제품 목록을 불러올 필요 없음
    products.value = [];
  }

  loading.value = true;
  rows.value = [];
  originalRows.value = [];
  selectedRows.value = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");
    const adminUserId = user.id;
    const currentTimestamp = new Date().toISOString();

    let idsToFetch = [];
    let shouldFetchByIds = false;

    // --- 데이터 처리 로직 ---
    // 자동 상태 변경 기능 제거: 이제 상태 변경 없이 데이터만 조회합니다.
    if (selectedStatus.value === '대기') {
      // 자동 상태 변경 제거: 단순히 대기 상태 데이터만 조회
    }
    else if (!selectedStatus.value) {
      // 자동 상태 변경 제거: 단순히 전체 데이터만 조회
    }
    // 3. '검수중' 또는 '완료' 선택 시: 상태 변경 없이 데이터만 불러옵니다.

    // --- 데이터 조회 로직 ---
    let query = supabase.from('performance_records').select(`
      *,
      companies(company_name, company_group),
      clients ( name ),
      products ( product_name, insurance_code, price )
    `);
    
    // promotion_product_list 조회 (보험코드로 매핑, 프로모션 기간 포함)
    const { data: promotionProducts, error: promotionError } = await supabase
      .from('promotion_product_list')
      .select('insurance_code, final_commission_rate, promotion_start_date, promotion_end_date');
    
    const promotionProductMap = {};
    if (!promotionError && promotionProducts) {
      promotionProducts.forEach(p => {
        promotionProductMap[String(p.insurance_code)] = {
          final_commission_rate: p.final_commission_rate,
          promotion_start_date: p.promotion_start_date,
          promotion_end_date: p.promotion_end_date
        };
      });
    }
    
    // promotion_product_hospital_performance 조회 (업체-병의원-제품 매핑)
    const { data: hospitalPerformance, error: hospitalPerfError } = await supabase
      .from('promotion_product_hospital_performance')
      .select(`
        hospital_id,
        first_performance_cso_id,
        promotion_product_list!inner(insurance_code)
      `)
      .eq('has_performance', true);
    
    // 병원-제품-업체 매핑: hospital_id_insurance_code_company_id 형식으로 저장
    const hospitalPerformanceMap = new Map();
    if (!hospitalPerfError && hospitalPerformance) {
      hospitalPerformance.forEach(hp => {
        const key = `${hp.hospital_id}_${hp.promotion_product_list?.insurance_code}`;
        // 같은 키에 여러 업체가 있을 수 있으므로 Set으로 저장
        if (!hospitalPerformanceMap.has(key)) {
          hospitalPerformanceMap.set(key, new Set());
        }
        if (hp.first_performance_cso_id) {
          hospitalPerformanceMap.get(key).add(hp.first_performance_cso_id);
        }
      });
    }
    
    // promotion_product_excluded_hospitals 조회 (제외 병원 목록)
    const { data: excludedHospitals, error: excludedError } = await supabase
      .from('promotion_product_excluded_hospitals')
      .select(`
        hospital_id,
        promotion_product_list!inner(insurance_code)
      `);
    
    // 제외 병원 매핑: insurance_code_hospital_id 형식으로 저장
    const excludedHospitalsMap = new Set();
    if (!excludedError && excludedHospitals) {
      excludedHospitals.forEach(eh => {
        const insuranceCode = eh.promotion_product_list?.insurance_code;
        if (insuranceCode) {
          const key = `${String(insuranceCode)}_${eh.hospital_id}`;
          excludedHospitalsMap.add(key);
        }
      });
    }

    if (shouldFetchByIds) {
      if (!idsToFetch || idsToFetch.length === 0) {
          rows.value = [];
          originalRows.value = [];
          loading.value = false;
          return;
      }

      // idsToFetch에 undefined나 null이 있는지 한 번 더 확인
      const validIds = idsToFetch.filter(id => id !== null && id !== undefined && id !== '');
      if (validIds.length !== idsToFetch.length) {
          console.warn("idsToFetch에 유효하지 않은 ID가 포함되어 있습니다:", idsToFetch);
      }

      query = query.in('id', validIds);
    } else {
      query = query.eq('settlement_month', selectedSettlementMonth.value);
      if (selectedCompanyId.value) query = query.eq('company_id', selectedCompanyId.value);
      if (selectedHospitalId.value) query = query.eq('client_id', selectedHospitalId.value);
      if (selectedStatus.value) query = query.eq('review_status', selectedStatus.value);
    }

    // === 1,000행 제한 해결: 전체 데이터 가져오기 ===
    let allData = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await query
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
        break;
      }

      allData = allData.concat(data);

      // 가져온 데이터가 batchSize보다 적으면 마지막 배치
      if (data.length < batchSize) {
        break;
      }

      from += batchSize;
    }

    if (!allData || allData.length === 0) {
      rows.value = [];
      originalRows.value = [];
      loading.value = false;
      return;
    }

    const registrarIds = [...new Set(allData.map(item => item.registered_by).filter(id => id))];
    const updaterIds = [...new Set(allData.map(item => item.updated_by).filter(id => id))];
    let registrarMap = new Map();
    let updaterMap = new Map();

    if (registrarIds.length > 0) {
      const { data: registrars, error: registrarError } = await supabase
        .from('companies')
        .select('user_id, company_name')
        .in('user_id', registrarIds);

      if (registrarError) {
        console.error("등록자 정보 조회 실패:", registrarError);
      } else {
        registrars.forEach(r => registrarMap.set(r.user_id, r.company_name));
      }
    }

    if (updaterIds.length > 0) {
      const { data: updaters, error: updaterError } = await supabase
        .from('companies')
        .select('user_id, company_name')
        .in('user_id', updaterIds);

      if (updaterError) {
        console.error("수정자 정보 조회 실패:", updaterError);
      } else {
        updaters.forEach(u => updaterMap.set(u.user_id, u.company_name));
      }
    }


    // 데이터 가공: Join된 객체를 펼치고, 화면 표시에 필요한 값을 설정
    rows.value = allData.map(item => {
      // 처방액 계산 (모든 건 포함)
      const prescriptionAmount = Math.round(item.prescription_qty * (item.products?.price || 0));
      
      // 삭제 처리된 건은 지급 처방액과 지급액을 0으로 표시
      let paymentPrescriptionAmount = 0;
      let paymentAmount = 0;
      let commissionRate = item.commission_rate;
      let isPromotionRateApplied = false; // 프로모션 수수료율 적용 여부 플래그

      if (item.review_action !== '삭제') {
        // 프로모션 제품 확인:
        // 1. 제품이 promotion_product_list에 있는지 확인 (보험코드로)
        // 2. 해당 병원이 promotion_product_hospital_performance에 있는지 확인 (hospital_id로)
        // 3. 업체가 first_performance_cso_id와 동일한지 확인
        // 4. 정산월이 프로모션 기간 내에 있는지 확인
        const insuranceCode = String(item.products?.insurance_code || '');
        const hospitalId = item.client_id;
        const companyId = item.company_id;
        const performanceKey = `${hospitalId}_${insuranceCode}`;
        const settlementMonth = item.settlement_month; // YYYY-MM 형식
        
        // 프로모션 제품 정보 확인
        const promotionProduct = promotionProductMap[insuranceCode];
        
        // 제외 병원 확인
        const excludedKey = `${insuranceCode}_${hospitalId}`;
        const isExcluded = excludedHospitalsMap.has(excludedKey);
        
        if (promotionProduct && 
            hospitalPerformanceMap.has(performanceKey) &&
            hospitalPerformanceMap.get(performanceKey).has(companyId) &&
            !isExcluded) { // 제외 병원이 아닌 경우에만 프로모션 적용
          
          // 프로모션 기간 확인: 정산월이 프로모션 시작일과 종료일 사이에 포함되어야 함
          let isWithinPromotionPeriod = true;
          
          const settlementDate = new Date(settlementMonth + '-01'); // 정산월의 첫 날
          const lastDayOfSettlementMonth = new Date(settlementDate.getFullYear(), settlementDate.getMonth() + 1, 0); // 정산월의 마지막 날
          
          if (promotionProduct.promotion_start_date) {
            const startDate = new Date(promotionProduct.promotion_start_date);
            // 정산월의 첫 날이 시작일 이후 또는 같아야 함
            if (settlementDate < startDate) {
              isWithinPromotionPeriod = false;
            }
          }
          
          if (promotionProduct.promotion_end_date) {
            const endDate = new Date(promotionProduct.promotion_end_date);
            // 정산월의 마지막 날이 종료일 이전 또는 같아야 함
            if (lastDayOfSettlementMonth > endDate) {
              isWithinPromotionPeriod = false;
            }
          }
          
          // 프로모션 기간 내에 있는 경우에만 final_commission_rate 사용
          if (isWithinPromotionPeriod) {
            commissionRate = promotionProduct.final_commission_rate;
            isPromotionRateApplied = true; // 프로모션 수수료율 적용됨
          }
        }
        
        // 수수료율이 있고 0보다 클 때만 지급 처방액 계산
        if (commissionRate !== null && commissionRate !== undefined && commissionRate > 0) {
          paymentPrescriptionAmount = prescriptionAmount; // 지급 처방액: 수수료가 지급되는 제품의 처방액
          paymentAmount = Math.round(prescriptionAmount * commissionRate);
        } else {
          // 수수료율이 없거나 0인 경우 지급 처방액과 지급액 모두 0
          paymentPrescriptionAmount = 0;
          paymentAmount = 0;
        }
      }

      return {
        ...item,
        id: item.id,
        company_name: item.companies?.company_name || 'N/A',
        client_name: item.clients?.name || 'N/A',
        product_name_display: item.products?.product_name || 'N/A',
        insurance_code: item.products?.insurance_code || '',
        price: item.products?.price ? Math.round(item.products.price).toLocaleString() : '0',
        commission_rate: commissionRate, // 프로모션 제품인 경우 final_commission_rate로 업데이트됨
        isPromotionRateApplied: isPromotionRateApplied, // 프로모션 수수료율 적용 여부
        prescription_amount: prescriptionAmount.toLocaleString(),
        payment_prescription_amount: paymentPrescriptionAmount.toLocaleString(),
        payment_amount: paymentAmount.toLocaleString(),
        registered_by_name: registrarMap.get(item.registered_by) || '관리자',
        updated_by_name: item.updated_by ? (updaterMap.get(item.updated_by) || '관리자') : '',
        display_status: item.review_status,
        // 합계 계산용 원본 숫자값 보존
        _raw_prescription_qty: Number(item.prescription_qty) || 0,
        _raw_prescription_amount: prescriptionAmount,
        _raw_payment_prescription_amount: paymentPrescriptionAmount,
        _raw_payment_amount: paymentAmount,
      };
    });

    originalRows.value = JSON.parse(JSON.stringify(rows.value));

  } catch (err) {
    console.error('데이터 처리 중 오류 발생:', err);
    console.error('오류 상세:', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      cause: err.cause
    });
    
    let errorMessage = '데이터를 처리하는 중 오류가 발생했습니다.';
    if (err.message && err.message.includes('Failed to fetch')) {
      errorMessage = '서버 연결에 실패했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.';
    } else if (err.message) {
      errorMessage = `데이터 처리 오류: ${err.message}`;
    }
    
    showError(errorMessage);
    rows.value = [];
  } finally {
    loading.value = false;
    selectedRows.value = [];
  }
}

// --- 행 편집 관련 함수 ---
function setProductInputRef(id, el) {
  if (el) {
    productInputRefs.value[id] = el;
  }
}

function startEdit(rowData) {
  if (isAnyEditing.value) return;

  const originalRow = originalRows.value.find(r => r.id === rowData.id);
  if (!originalRow) {
    console.error("Original row not found for editing:", rowData.id);
    return;
  }

  const index = rows.value.findIndex(r => r.id === rowData.id);
  if (index !== -1) {
    // 수수료율을 퍼센트로 변환 (소수점 0.36 -> 36)
    const commissionRatePercent = originalRow.commission_rate !== null && originalRow.commission_rate !== undefined
      ? (originalRow.commission_rate * 100).toFixed(1)
      : null;
    
    const editRow = {
      ...JSON.parse(JSON.stringify(originalRow)),
      isEditing: true,
      product_id_modify: originalRow.product_id,
      product_name_search: originalRow.product_name_display,
      prescription_month_modify: originalRow.prescription_month,
      prescription_qty_modify: originalRow.prescription_qty,
      prescription_type_modify: originalRow.prescription_type,
      commission_rate_modify: commissionRatePercent,
      remarks_modify: originalRow.remarks,
      price_for_calc: parseFloat(String(originalRow.price || '0').replace(/,/g, '')) || 0,
      // 편집 모드에서도 원본 데이터 보존
      _raw_prescription_qty: originalRow._raw_prescription_qty || 0,
      _raw_prescription_amount: originalRow._raw_prescription_amount || 0,
      _raw_payment_prescription_amount: originalRow._raw_payment_prescription_amount || 0,
      _raw_payment_amount: originalRow._raw_payment_amount || 0,
      showProductSearchList: false,
      productSearchResults: [],
      productSearchSelectedIndex: -1,
      productDropdownStyle: {},
    };
    rows.value[index] = editRow;
    activeEditingRowId.value = rowData.id;

    // 제품명 입력 필드를 클릭하거나 포커스했을 때만 셀렉트 리스트가 보이도록 함
    // handleProductNameFocus(editRow); // 자동으로 펼쳐지지 않도록 제거
  }
}

function cancelEdit(rowData) {
  const originalRow = originalRows.value.find(r => r.id === rowData.id);
  const index = rows.value.findIndex(r => r.id === rowData.id);
  // 새로 추가 중이던 행(원본이 없는 행)을 취소하면 목록에서 제거
  if (!originalRows.value.some(r => r.id === rowData.id)) {
    rows.value.splice(index, 1);
  } else if (index !== -1 && originalRow) {
    rows.value[index] = JSON.parse(JSON.stringify(originalRow));
  }
  activeEditingRowId.value = null;
}

async function saveEdit(rowData) {
  // 필수 값 검증
  if (!rowData.product_id_modify || rowData.prescription_qty_modify === null || rowData.prescription_qty_modify === '') {
    showWarning('제품명과 수량은 필수 입력 항목입니다.');
    return;
  }

  loading.value = true;
  activeEditingRowId.value = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');
    const adminUserId = user.id;

    const isNewRecord = !originalRows.value.some(r => r.id === rowData.id);

    // 수수료율 검증 (100% 초과 방지)
    const commissionRateStr = String(rowData.commission_rate_modify || '').replace(/,/g, '').replace(/%/g, '');
    const commissionRateNum = Number(commissionRateStr);
    if (!isNaN(commissionRateNum) && commissionRateNum > 100) {
      throw new Error('수수료율은 100%를 초과할 수 없습니다.');
    }
    
    const calculatedRate = convertCommissionRateToDecimal(rowData.commission_rate_modify);
    if (calculatedRate > 1) {
      throw new Error('수수료율은 100%를 초과할 수 없습니다.');
    }

    let saveData = {
      settlement_month: rowData.settlement_month,
      company_id: rowData.company_id,
      client_id: rowData.client_id,
      product_id: rowData.product_id_modify,
      prescription_month: rowData.prescription_month_modify,
      prescription_qty: Number(rowData.prescription_qty_modify) || 0,
      prescription_type: rowData.prescription_type_modify,
      commission_rate: calculatedRate,
      remarks: rowData.remarks_modify,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    };

    let error;

    if (isNewRecord) {
      // 추가 (INSERT) - 신규 등록
      let newRecordStatus;
      if (selectedStatus.value === null) {
        // 전체 상태일 때는 검수중으로 설정
        newRecordStatus = '검수중';
      } else {
        // 특정 상태가 선택되었을 때는 해당 상태로 설정
        newRecordStatus = selectedStatus.value;
      }
      
      saveData = {
        ...saveData,
        review_status: newRecordStatus,
        created_at: new Date().toISOString(),
        registered_by: adminUserId,
        review_action: '추가',
      };
      const { error: insertError } = await supabase.from('performance_records').insert(saveData);
      error = insertError;
    } else {
      // 수정 (UPDATE) - 기존 레코드 수정
      let updateStatus;
      if (selectedStatus.value === null) {
        // 전체 상태일 때는 현재 상태 유지
        updateStatus = rowData.review_status;
      } else {
        // 특정 상태가 선택되었을 때는 해당 상태로 설정
        updateStatus = selectedStatus.value;
      }
      
      saveData = {
        ...saveData,
        review_status: updateStatus,
        review_action: '수정',
      };
      const { error: updateError } = await supabase.from('performance_records').update(saveData).eq('id', rowData.id);
      error = updateError;
      
      // 주석: 트리거가 자동으로 promotion_product_hospital_performance를 업데이트하므로
      // 프론트엔드에서 수동 호출 불필요
    }

    if (error) throw error;

    // 성공 알림
    showSuccess('실적이 성공적으로 저장되었습니다.');
    
    await loadPerformanceData();
  } catch (err) {
    // 상세 에러 로깅
    console.error('실적 저장 실패:', err);
    console.error('에러 상세:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack
    });
    
    // 사용자 친화적인 에러 메시지 생성
    let errorMessage = '저장 중 오류가 발생했습니다.';
    
    if (err.message) {
      if (err.message.includes('duplicate') || err.message.includes('중복')) {
        errorMessage = '중복된 데이터가 있습니다. 다시 확인해주세요.';
      } else if (err.message.includes('foreign key') || err.message.includes('참조')) {
        errorMessage = '연관된 데이터가 없습니다. 제품, 업체, 병원 정보를 확인해주세요.';
      } else if (err.message.includes('null') || err.message.includes('필수')) {
        errorMessage = '필수 항목이 누락되었습니다. 모든 항목을 입력해주세요.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
      } else {
        errorMessage = `저장 실패: ${err.message}`;
      }
    }
    
    // Toast 알림으로 에러 표시
    showError(errorMessage);
    
    // 실패 시, 편집모드로 되돌리거나 원본으로 복구하는 로직 추가 가능
  } finally {
    loading.value = false;
  }
}

// DataTable의 row-edit-save 이벤트 핸들러
function onRowEditSave(event) {
  // DataTable의 기본 편집 기능은 사용하지 않고 커스텀 편집을 사용하므로
  // 이 함수는 빈 함수로 두거나 기본 동작을 정의할 수 있습니다.
}

function addRowBelow(referenceRow) {
  if (isAnyEditing.value) return;

  const refIndex = rows.value.findIndex(r => r.id === referenceRow.id);
  
  // 상태 필터에 따른 초기 상태 설정
  let initialStatus;
  if (selectedStatus.value === null) {
    // 전체 상태일 때는 검수중으로 설정
    initialStatus = '검수중';
  } else {
    // 특정 상태가 선택되었을 때는 해당 상태로 설정
    initialStatus = selectedStatus.value;
  }
  
  const newRow = {
    id: uuidv4(),
    isEditing: true,
    review_action: '추가',
    review_status: initialStatus, // 상태 필터에 따라 동적으로 설정

    // --- 복사되는 데이터 ---
    settlement_month: referenceRow.settlement_month,
    company_id: referenceRow.company_id,
    company_name: referenceRow.company_name, // 화면 표시용
    client_id: referenceRow.client_id,
    client_name: referenceRow.client_name, // 화면 표시용

    // --- 수정 가능한 데이터 (복사 후 수정) ---
    prescription_month_modify: referenceRow.prescription_month || getPrescriptionMonth(selectedSettlementMonth.value, 1),
    prescription_type_modify: referenceRow.prescription_type,

    // --- 초기화되는 데이터 ---
    product_id_modify: null,
    product_name_display: '',
    product_name_search: '',
    insurance_code: '',
    prescription_qty_modify: null,
    commission_rate_modify: null,
    remarks_modify: '',

    // --- 계산을 위한 초기값 ---
    price_for_calc: 0,
    prescription_amount_modify: 0,
    payment_amount_modify: 0,
    // 원본 데이터 초기화
    _raw_prescription_qty: 0,
    _raw_prescription_amount: 0,
    _raw_payment_prescription_amount: 0,
    _raw_payment_amount: 0,

    // --- UI 상태 ---
    showProductSearchList: false,
    productSearchResults: [],
    productSearchSelectedIndex: -1,
    productDropdownStyle: {}, // 드롭다운 위치 스타일
  };

  rows.value.splice(refIndex + 1, 0, newRow);
  activeEditingRowId.value = newRow.id;
  productInputRefs.value[newRow.id]?.focus();
}

// --- 처방월 변경 이벤트 핸들러 ---
async function handlePrescriptionMonthChange(rowData) {
  const reactiveRow = rows.value.find(r => r.id === rowData.id);
  if (!reactiveRow) return;

  // 처방월이 변경되었고 제품이 선택되어 있으면 정보 업데이트
  if (reactiveRow.product_id_modify) {
    await updateProductInfoForMonthChange(rowData);
  }

  // 해당 월의 제품 목록이 로드되어 있지 않으면 로드
  if (reactiveRow.prescription_month_modify && !products.value.some(p => p.base_month === reactiveRow.prescription_month_modify)) {
    await fetchProducts(reactiveRow.prescription_month_modify);
  }
}

const confirmDeleteRow = async (row) => {
  if (isAnyEditing.value) return;

  const confirmMessage = "선택한 행을 삭제하시겠습니까?\n실제 데이터는 삭제되지 않고, 합계, 흡수율 분석, 정산 대상에서만 제외됩니다.";
  if (confirm(confirmMessage)) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userUid = session?.user?.id;

      const { error } = await supabase
        .from('performance_records')
        .update({
          review_action: '삭제',
          review_status: '완료',
          updated_by: userUid,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (error) throw error;

      // 로컬 데이터 업데이트
      const index = rows.value.findIndex(r => r.id === row.id);
      if (index !== -1) {
        rows.value[index].review_action = '삭제';
        rows.value[index].review_status = '완료';
      }

      showSuccess("해당 항목이 삭제 처리되었습니다. 되돌리기를 하시면 다시 검수 완료가 가능합니다.");

      // 데이터 다시 로드하여 화면 업데이트
      await loadPerformanceData();

    } catch (error) {
      console.error('삭제 처리 중 오류:', error);
      showError(`오류가 발생했습니다: ${error.message}`);
    }
  }
};

const restoreRow = async (row) => {
  if (isAnyEditing.value) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userUid = session?.user?.id;

    const { error } = await supabase
      .from('performance_records')
      .update({
        review_action: null,
        review_status: '검수중',
        updated_by: userUid,
        updated_at: new Date().toISOString()
      })
      .eq('id', row.id);

    if (error) throw error;

    const index = rows.value.findIndex(r => r.id === row.id);
    if (index !== -1) {
      rows.value[index].review_action = null;
      rows.value[index].review_status = '검수중'; // 복원 시 검수중으로 변경
    }
    showSuccess('항목이 복원되었습니다.');

    // 데이터 다시 로드하여 화면 업데이트
    await loadPerformanceData();
  } catch(error) {
    console.error('복원 중 오류:', error);
    showError(`복원 중 오류가 발생했습니다: ${error.message}`);
  }
};

// --- 헤더 체크박스 액션 함수 ---
function toggleAllSelection() {
  // 현재 페이지의 행만 선택하도록 수정
  const startIndex = currentPageFirstIndex.value;
  const endIndex = startIndex + rowsPerPage.value;

  // 현재 페이지에 표시되는 행만 필터링
  const currentPageRows = displayRows.value
  .filter((record, index) => index >= startIndex && index < endIndex && record.review_action !== '삭제');

  if (isAllSelected.value) {
    // 전체 해제
    selectedRows.value = [];
  } else {
    // 현재 페이지만 선택
    selectedRows.value = [...currentPageRows];
  }
}

// --- 개별 행 체크박스 액션 함수 ---
function toggleRowSelection(row) {
  if (row.review_action === '삭제') return; // 삭제된 항목은 선택 불가

  const index = selectedRows.value.findIndex(selectedRow => selectedRow.id === row.id);
  if (index > -1) {
    // 이미 선택된 경우 제거
    selectedRows.value.splice(index, 1);
  } else {
    // 선택되지 않은 경우 추가
    selectedRows.value.push(row);
  }
}

function changeReviewStatus() {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    showWarning("상태를 변경할 항목을 선택해주세요.");
    return;
  }
  
  // 상태 선택 모달 열기
  showStatusChangeModal.value = true;
  selectedNewStatus.value = '';
}

async function confirmStatusChange() {
  if (!selectedNewStatus.value) {
    showWarning("변경할 상태를 선택해주세요.");
    return;
  }

  if (!selectedRows.value || selectedRows.value.length === 0) {
    showWarning("상태를 변경할 항목을 선택해주세요.");
    return;
  }

  // 상태 선택 모달 먼저 닫기
  showStatusChangeModal.value = false;
  
  const confirmed = await showConfirm(`선택된 ${selectedRows.value.length}개 항목의 상태를 '${selectedNewStatus.value}'로 변경하시겠습니까?`, '상태 변경 확인');
  if (confirmed) {
    loading.value = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const updates = selectedRows.value.map(record => {
        return supabase
          .from('performance_records')
          .update({
            review_status: selectedNewStatus.value,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', record.id);
      });

      const results = await Promise.all(updates);
      const errors = results.filter(res => res.error);

      if (errors.length > 0) {
        throw new Error(`다음 항목들의 상태 변경에 실패했습니다: ${errors.map(e=>e.error.message).join(', ')}`);
      }

      // 프로모션 관리 데이터 업데이트: 변경된 레코드 중 프로모션 제품이 있는지 확인
      await updatePromotionDataForChangedRecords(selectedRows.value);

      showSuccess(`${selectedRows.value.length}개 항목의 상태를 '${selectedNewStatus.value}'로 성공적으로 변경했습니다.`);
      await loadPerformanceData(); // 데이터 새로고침
      
      // 상태 변경 완료 후 편집 모드 해제 유지
      activeEditingRowId.value = null;
      
      // 모달 닫기
      showStatusChangeModal.value = false;
      selectedNewStatus.value = '';
    } catch (error) {
      console.error('상태 변경 오류:', error);
      showError(error.message);
      // 오류 발생 시에도 편집 모드 해제
      activeEditingRowId.value = null;
    } finally {
      loading.value = false;
    }
  }
}

function cancelStatusChange() {
  showStatusChangeModal.value = false;
  selectedNewStatus.value = '';
}

// 프로모션 데이터 업데이트 함수 (프로모션 관리 페이지의 checkStatistics와 동일)
async function checkPromotionStatistics() {
  if (!confirm('제품별 병원 실적을 확인하고 데이터를 업데이트하시겠습니까?')) {
    return;
  }

  checkingStatistics.value = true;
  showStatisticsModal.value = true;
  statisticsCompleted.value = false;
  statisticsProgress.value = 0;
  statisticsCurrentIndex.value = 0;
  statisticsStatus.value = '프로모션 제품 목록 조회 중...';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 정보가 유효하지 않습니다.');

    // 프로모션 제품 목록 조회
    const { data: products, error: productsError } = await supabase
      .from('promotion_product_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;
    promotionProducts.value = products || [];
    statisticsTotalCount.value = promotionProducts.value.length;

    if (promotionProducts.value.length === 0) {
      statisticsStatus.value = '프로모션 제품이 없습니다.';
      statisticsCompleted.value = true;
      return;
    }

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // 각 프로모션 제품에 대해 처리 (프로모션 관리 페이지의 checkStatistics 로직과 동일)
    for (let i = 0; i < promotionProducts.value.length; i++) {
      const promotionProduct = promotionProducts.value[i];
      statisticsCurrentIndex.value = i + 1;
      statisticsProgress.value = Math.round(((i + 1) / promotionProducts.value.length) * 100);
      statisticsCurrentProduct.value = promotionProduct.product_name;
      statisticsStatus.value = `제품 처리 중... (${i + 1}/${promotionProducts.value.length})`;
      
      try {
        const insuranceCode = String(promotionProduct.insurance_code);
        
        // 각 제품의 promotion_start_date를 기준일로 사용
        let baseMonth = null;
        if (promotionProduct.promotion_start_date) {
          const dateStr = promotionProduct.promotion_start_date;
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            baseMonth = dateStr.substring(0, 7);
          } else {
            const startDate = new Date(promotionProduct.promotion_start_date);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            baseMonth = `${year}-${month}`;
          }
        }
        
        if (!baseMonth) {
          console.log(`제품 ${promotionProduct.product_name}의 프로모션 시작일이 없어 스킵합니다.`);
          totalSkipped++;
          continue;
        }
        
        statisticsStatus.value = `제품 정보 조회 중... (기준일: ${baseMonth}) (${i + 1}/${promotionProducts.value.length})`;
        
        // 프로모션 시작일과 종료일을 Date 객체로 변환
        const promotionStartDate = promotionProduct.promotion_start_date ? new Date(promotionProduct.promotion_start_date) : null;
        const promotionEndDate = promotionProduct.promotion_end_date ? new Date(promotionProduct.promotion_end_date) : null;
        
        // 해당 보험코드를 가진 제품들의 실적 데이터 조회 (완료 상태, 삭제 제외)
        const { data: performanceRecords, error: recordsError } = await supabase
          .from('performance_records')
          .select(`
            id,
            company_id,
            client_id,
            product_id,
            prescription_qty,
            prescription_month,
            settlement_month,
            review_status,
            review_action,
            products!inner(insurance_code, price),
            companies!inner(company_group)
          `)
          .eq('products.insurance_code', insuranceCode)
          .eq('companies.company_group', 'NEWCSO')
          .eq('review_status', '완료')
          .or('review_action.is.null,review_action.neq.삭제');

        if (recordsError || !performanceRecords || performanceRecords.length === 0) {
          console.log(`제품 ${promotionProduct.product_name} (보험코드: ${insuranceCode})에 해당하는 실적 데이터가 없습니다.`);
          totalSkipped++;
          continue;
        }

        statisticsStatus.value = `데이터 처리 중... (${i + 1}/${promotionProducts.value.length})`;

        // 병원별로 데이터 정리
        const hospitalDataMap = new Map();
        
        for (const record of performanceRecords) {
          if (!record.client_id || record.review_action === '삭제') continue;

          const hospitalId = record.client_id;
          const productPrice = Number(record.products?.price) || 0;
          const prescriptionQty = Number(record.prescription_qty) || 0;
          const prescriptionAmount = prescriptionQty * productPrice;
          const prescriptionMonth = record.prescription_month;

          // 프로모션 시작일 이전 데이터인지 확인
          let isBeforeStartDate = false;
          if (promotionStartDate && prescriptionMonth) {
            const prescriptionDate = new Date(prescriptionMonth + '-01');
            isBeforeStartDate = prescriptionDate < promotionStartDate;
          } else if (!promotionStartDate && prescriptionMonth) {
            isBeforeStartDate = prescriptionMonth < baseMonth;
          }

          // 프로모션 종료일 이후 데이터인지 확인
          let isAfterEndDate = false;
          if (promotionEndDate && prescriptionMonth) {
            const prescriptionDate = new Date(prescriptionMonth + '-01');
            isAfterEndDate = prescriptionDate > promotionEndDate;
          }

          if (!hospitalDataMap.has(hospitalId)) {
            hospitalDataMap.set(hospitalId, {
              hospital_id: hospitalId,
              first_performance_cso_id: isBeforeStartDate ? null : record.company_id,
              first_performance_month: prescriptionMonth || null,
              total_performance_amount: prescriptionAmount,
              before_promotion_amount: isBeforeStartDate ? prescriptionAmount : 0,
              after_promotion_amount: (!isBeforeStartDate && !isAfterEndDate) ? prescriptionAmount : 0
            });
          } else {
            const existing = hospitalDataMap.get(hospitalId);
            
            // first_performance_month 업데이트 (더 이른 날짜로)
            if (prescriptionMonth && (!existing.first_performance_month || prescriptionMonth < existing.first_performance_month)) {
              existing.first_performance_month = prescriptionMonth;
              // 프로모션 시작일 이전이면 CSO ID는 null
              if (isBeforeStartDate) {
                existing.first_performance_cso_id = null;
              } else if (existing.first_performance_cso_id === null) {
                existing.first_performance_cso_id = record.company_id;
              }
            }
            
            existing.total_performance_amount = (existing.total_performance_amount || 0) + prescriptionAmount;
            if (isBeforeStartDate) {
              existing.before_promotion_amount = (existing.before_promotion_amount || 0) + prescriptionAmount;
            } else if (!isAfterEndDate) {
              existing.after_promotion_amount = (existing.after_promotion_amount || 0) + prescriptionAmount;
            }
          }
        }

        statisticsStatus.value = `데이터 저장 중... (${i + 1}/${promotionProducts.value.length})`;

        // promotion_product_hospital_performance 테이블에 데이터 삽입/업데이트
        const performanceData = Array.from(hospitalDataMap.values()).map(item => ({
          promotion_product_id: promotionProduct.id,
          hospital_id: item.hospital_id,
          has_performance: true,
          first_performance_cso_id: item.first_performance_cso_id,
          first_performance_month: item.first_performance_month || null,
          total_performance_amount: item.total_performance_amount || 0,
          before_promotion_amount: item.before_promotion_amount || 0,
          after_promotion_amount: item.after_promotion_amount || 0,
          created_by: user.id,
          updated_by: user.id
        }));

        if (performanceData.length > 0) {
          // 기존 데이터 확인 및 업데이트 또는 삽입
          for (const item of performanceData) {
            const { data: existing, error: checkError } = await supabase
              .from('promotion_product_hospital_performance')
              .select('id, before_promotion_amount, after_promotion_amount, total_performance_amount')
              .eq('promotion_product_id', item.promotion_product_id)
              .eq('hospital_id', item.hospital_id)
              .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 데이터 없음 오류
              console.error(`기존 데이터 확인 오류 (제품 ${promotionProduct.product_name}, 병원 ${item.hospital_id}):`, checkError);
              continue;
            }

            if (existing) {
              // 기존 데이터 업데이트 (덮어쓰기 방식으로 변경 - 중복 계산 방지)
              // 기존 값에 누적하지 않고, 새로 계산한 값으로 덮어쓰기
              const newTotalAmount = item.before_promotion_amount + item.after_promotion_amount;

              const { error: updateError } = await supabase
                .from('promotion_product_hospital_performance')
                .update({
                  has_performance: true,
                  first_performance_cso_id: item.first_performance_cso_id,
                  first_performance_month: item.first_performance_month,
                  total_performance_amount: newTotalAmount,
                  before_promotion_amount: item.before_promotion_amount,
                  after_promotion_amount: item.after_promotion_amount,
                  updated_by: user.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

              if (updateError) {
                console.error(`데이터 업데이트 오류 (제품 ${promotionProduct.product_name}, 병원 ${item.hospital_id}):`, updateError);
                totalErrors++;
              } else {
                totalUpdated++;
              }
            } else {
              // 신규 데이터 삽입
              const { error: insertError } = await supabase
                .from('promotion_product_hospital_performance')
                .insert(item);

              if (insertError) {
                console.error(`데이터 삽입 오류 (제품 ${promotionProduct.product_name}, 병원 ${item.hospital_id}):`, insertError);
                totalErrors++;
              } else {
                totalUpdated++;
              }
            }
          }
        }

        totalProcessed++;
        console.log(`제품 ${promotionProduct.product_name}: 처리 완료`);
      } catch (error) {
        console.error(`제품 ${promotionProduct.product_name} 처리 오류:`, error);
        totalErrors++;
      }
    }

    statisticsProgress.value = 100;
    statisticsStatus.value = `완료! 처리된 제품: ${totalProcessed}개, 업데이트: ${totalUpdated}개, 스킵: ${totalSkipped}개, 오류: ${totalErrors}개`;
    statisticsCurrentProduct.value = '';
    statisticsCompleted.value = true;
    
    // 마지막 업데이트 시간을 DB에 저장
    await saveLastUpdateTime();
  } catch (error) {
    console.error('프로모션 데이터 업데이트 오류:', error);
    statisticsStatus.value = `오류 발생: ${error.message || error}`;
    statisticsCompleted.value = true;
    showError('데이터 업데이트 중 오류가 발생했습니다: ' + (error.message || error));
  } finally {
    checkingStatistics.value = false;
  }
}

function closeStatisticsModal() {
  showStatisticsModal.value = false;
  statisticsCompleted.value = false;
  statisticsProgress.value = 0;
  statisticsCurrentIndex.value = 0;
  statisticsTotalCount.value = 0;
  statisticsCurrentProduct.value = '';
  statisticsStatus.value = '';
}

// 마지막 업데이트 시간을 DB에 저장 (로그 테이블 사용)
async function saveLastUpdateTime() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    const now = new Date().toISOString();
    
    // promotion_statistics_log 테이블에 로그 저장
    // 먼저 기존 로그가 있는지 확인
    const { data: existingLogs, error: checkError } = await supabase
      .from('promotion_statistics_log')
      .select('id')
      .limit(1);

    if (checkError) {
      // 테이블이 없거나 오류가 발생하면 무시
      console.warn('promotion_statistics_log 테이블 조회 오류:', checkError);
      return;
    }

    if (existingLogs && existingLogs.length > 0) {
      // 기존 로그가 있으면 UPDATE
      const { error: updateError } = await supabase
        .from('promotion_statistics_log')
        .update({
          last_update_time: now,
          updated_by: user.id
        })
        .eq('id', existingLogs[0].id);
      
      if (updateError) {
        console.error('마지막 업데이트 시간 저장 오류:', updateError);
        return;
      }
    } else {
      // 기존 로그가 없으면 INSERT
      const { error: insertError } = await supabase
        .from('promotion_statistics_log')
        .insert({
          last_update_time: now,
          updated_by: user.id
        });
      
      if (insertError) {
        console.error('마지막 업데이트 시간 저장 오류:', insertError);
        return;
      }
    }
  } catch (error) {
    console.error('마지막 업데이트 시간 저장 오류:', error);
  }
}

// 프로모션 관리 데이터 업데이트: 변경된 레코드 중 프로모션 제품이 있는 경우 업데이트
async function updatePromotionDataForChangedRecords(changedRecords) {
  try {
    if (!changedRecords || changedRecords.length === 0) return;

    // 1. 변경된 레코드들의 제품 ID 수집
    const productIds = [...new Set(changedRecords.map(record => record.product_id).filter(id => id))];
    if (productIds.length === 0) return;

    // 2. 제품 정보 조회 (insurance_code 포함)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, insurance_code')
      .in('id', productIds);

    if (productsError || !products || products.length === 0) {
      console.log('프로모션 데이터 업데이트: 제품 정보 조회 실패 또는 제품 없음');
      return;
    }

    // 3. 프로모션 제품 확인 (promotion_product_list에서 insurance_code로 확인)
    const insuranceCodes = [...new Set(products.map(p => p.insurance_code).filter(code => code))];
    if (insuranceCodes.length === 0) {
      console.log('프로모션 데이터 업데이트: 보험코드 없음');
      return;
    }

    const { data: promotionProducts, error: promotionError } = await supabase
      .from('promotion_product_list')
      .select('id, insurance_code, product_name, promotion_start_date, promotion_end_date')
      .in('insurance_code', insuranceCodes);

    if (promotionError || !promotionProducts || promotionProducts.length === 0) {
      console.log('프로모션 데이터 업데이트: 프로모션 제품 없음');
      return;
    }

    console.log(`프로모션 데이터 업데이트: ${promotionProducts.length}개 프로모션 제품 발견`);

    // 4. 프로모션 제품이 있으면 해당 제품들에 대해 프로모션 관리 데이터 업데이트
    // 각 프로모션 제품에 대해 해당 제품의 실적 데이터를 기반으로 promotion_product_hospital_performance 업데이트
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('프로모션 데이터 업데이트: 로그인 정보 없음');
      return;
    }

    for (const promotionProduct of promotionProducts) {
      try {
        const insuranceCode = String(promotionProduct.insurance_code);
        
        // 프로모션 시작일 확인
        const promotionStartDate = promotionProduct.promotion_start_date ? new Date(promotionProduct.promotion_start_date) : null;
        const promotionEndDate = promotionProduct.promotion_end_date ? new Date(promotionProduct.promotion_end_date) : null;
        
        // 프로모션 시작일이 없으면 스킵
        if (!promotionStartDate) {
          console.log(`프로모션 데이터 업데이트: ${promotionProduct.product_name} - 프로모션 시작일 없음`);
          continue;
        }
        
        // 해당 보험코드를 가진 제품들의 실적 데이터 조회 (완료 상태, 삭제 제외)
        const { data: performanceRecords, error: recordsError } = await supabase
          .from('performance_records')
          .select(`
            id,
            company_id,
            client_id,
            product_id,
            prescription_qty,
            prescription_month,
            settlement_month,
            review_status,
            review_action,
            products!inner(insurance_code, price),
            companies!inner(company_group)
          `)
          .eq('products.insurance_code', insuranceCode)
          .eq('companies.company_group', 'NEWCSO')
          .eq('review_status', '완료')
          .or('review_action.is.null,review_action.neq.삭제');

        if (recordsError || !performanceRecords || performanceRecords.length === 0) {
          console.log(`프로모션 데이터 업데이트: ${promotionProduct.product_name} - 실적 데이터 없음`);
          continue;
        }

        // 프로모션 시작일을 기준으로 baseMonth 계산 (프로모션 관리 페이지와 동일한 로직)
        let baseMonth = null;
        if (promotionProduct.promotion_start_date) {
          const dateStr = promotionProduct.promotion_start_date;
          if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            baseMonth = dateStr.substring(0, 7);
          } else {
            const startDate = new Date(promotionProduct.promotion_start_date);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, '0');
            baseMonth = `${year}-${month}`;
          }
        }

        // 병원별로 그룹화하여 promotion_product_hospital_performance 업데이트
        // 프로모션 관리 페이지의 checkStatistics 함수와 동일한 로직 사용
        const hospitalMap = new Map();
        
        // 처방월을 기준으로 before/after 분류
        performanceRecords.forEach(record => {
          const hospitalId = record.client_id;
          if (!hospitalId || record.review_action === '삭제') return;

          const productPrice = Number(record.products?.price) || 0;
          const prescriptionQty = Number(record.prescription_qty) || 0;
          const prescriptionAmount = productPrice * prescriptionQty;
          
          // 처방월이 프로모션 시작일 이전인지 확인
          let isBeforeStartDate = false;
          if (record.prescription_month && promotionStartDate) {
            const prescriptionDate = new Date(record.prescription_month + '-01');
            isBeforeStartDate = prescriptionDate < promotionStartDate;
          } else if (record.prescription_month && baseMonth) {
            isBeforeStartDate = record.prescription_month < baseMonth;
          }

          // 처방월이 프로모션 종료일 이후인지 확인
          let isAfterEndDate = false;
          if (record.prescription_month && promotionEndDate) {
            const prescriptionDate = new Date(record.prescription_month + '-01');
            const lastDayOfPrescriptionMonth = new Date(prescriptionDate.getFullYear(), prescriptionDate.getMonth() + 1, 0);
            isAfterEndDate = lastDayOfPrescriptionMonth > promotionEndDate;
          }

          if (!hospitalMap.has(hospitalId)) {
            hospitalMap.set(hospitalId, {
              hospital_id: hospitalId,
              total_performance_amount: 0,
              before_promotion_amount: 0,
              after_promotion_amount: 0,
              first_performance_cso_id: null,
              first_performance_month: null,
              has_before_start_date: false
            });
          }

          const hospitalData = hospitalMap.get(hospitalId);
          
          // 종료일 이후 데이터는 total에만 포함 (프로모션 금액에는 포함하지 않음)
          if (isAfterEndDate) {
            hospitalData.total_performance_amount += prescriptionAmount;
            return;
          }

          // 프로모션 시작일 이전 데이터 처리
          if (isBeforeStartDate) {
            hospitalData.has_before_start_date = true;
            hospitalData.total_performance_amount += prescriptionAmount;
            hospitalData.before_promotion_amount += prescriptionAmount;
            
            // first_performance_month는 가장 이른 처방월로 설정
            if (!hospitalData.first_performance_month || 
                record.prescription_month < hospitalData.first_performance_month) {
              hospitalData.first_performance_month = record.prescription_month;
              hospitalData.first_performance_cso_id = null; // 프로모션 시작일 이전이므로 null
            }
          } else {
            // 프로모션 시작일 이후 데이터 처리
            hospitalData.total_performance_amount += prescriptionAmount;
            hospitalData.after_promotion_amount += prescriptionAmount;
            
            // first_performance_cso_id 설정 (프로모션 시작일 이전 데이터가 없을 때만)
            if (prescriptionQty > 0) {
              if (!hospitalData.first_performance_month || 
                  record.prescription_month < hospitalData.first_performance_month) {
                hospitalData.first_performance_month = record.prescription_month;
                // 프로모션 시작일 이전 데이터가 없을 때만 CSO ID 설정
                if (!hospitalData.has_before_start_date) {
                  hospitalData.first_performance_cso_id = record.company_id;
                } else {
                  hospitalData.first_performance_cso_id = null; // 이전 데이터가 있으면 null
                }
              }
            }
          }
        });

        // 각 병원에 대해 promotion_product_hospital_performance 업데이트
        for (const [hospitalId, hospitalData] of hospitalMap.entries()) {
          // 기존 데이터 확인
          const { data: existingData, error: existingError } = await supabase
            .from('promotion_product_hospital_performance')
            .select('*')
            .eq('promotion_product_id', promotionProduct.id)
            .eq('hospital_id', hospitalId)
            .single();

          if (existingError && existingError.code === 'PGRST116') {
            // 기존 데이터가 없으면 INSERT
            // 프로모션 시작일 이전 데이터가 있으면 first_performance_cso_id는 null이어야 함
            const finalCSOId = hospitalData.has_before_start_date ? null : hospitalData.first_performance_cso_id;
            
            const { error: insertError } = await supabase
              .from('promotion_product_hospital_performance')
              .insert({
                promotion_product_id: promotionProduct.id,
                hospital_id: hospitalId,
                has_performance: true,
                first_performance_cso_id: finalCSOId,
                first_performance_month: hospitalData.first_performance_month,
                total_performance_amount: hospitalData.total_performance_amount,
                before_promotion_amount: hospitalData.before_promotion_amount,
                after_promotion_amount: hospitalData.after_promotion_amount,
                created_by: user.id,
                updated_by: user.id
              });

            if (insertError) {
              console.error(`프로모션 데이터 INSERT 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, insertError);
            }
          } else if (existingData) {
            // 기존 데이터가 있으면 UPDATE
            // 프로모션 시작일 이전 데이터가 있으면 first_performance_cso_id는 null이어야 함
            const finalCSOId = hospitalData.has_before_start_date ? null : hospitalData.first_performance_cso_id;
            
            // 기존 데이터의 before/after 금액을 덮어쓰기 (중복 계산 방지)
            // 기존 값에 누적하지 않고, 새로 계산한 값으로 덮어쓰기
            const newTotalAmount = hospitalData.before_promotion_amount + hospitalData.after_promotion_amount;
            
            const { error: updateError } = await supabase
              .from('promotion_product_hospital_performance')
              .update({
                has_performance: true,
                total_performance_amount: newTotalAmount,
                before_promotion_amount: hospitalData.before_promotion_amount,
                after_promotion_amount: hospitalData.after_promotion_amount,
                first_performance_cso_id: finalCSOId,
                first_performance_month: hospitalData.first_performance_month,
                updated_by: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingData.id);

            if (updateError) {
              console.error(`프로모션 데이터 UPDATE 오류 (제품 ${promotionProduct.product_name}, 병원 ${hospitalId}):`, updateError);
            }
          }
        }

        console.log(`프로모션 데이터 업데이트 완료: ${promotionProduct.product_name} (${hospitalMap.size}개 병원)`);
      } catch (error) {
        console.error(`프로모션 데이터 업데이트 오류 (제품 ${promotionProduct.product_name}):`, error);
      }
    }
  } catch (error) {
    console.error('프로모션 데이터 업데이트 전체 오류:', error);
    // 오류가 발생해도 상태 변경은 계속 진행되도록 함
  }
}

// --- 유틸리티 함수 ---
// 회사-거래처 매핑에서 수수료율 등급 조회 함수
async function getCommissionGradeForClientCompany(companyId, clientId) {
  const { data, error } = await supabase
    .from('client_company_assignments')
    .select('modified_commission_grade, company_default_commission_grade')
    .eq('company_id', companyId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    // 매핑 정보가 없으면 회사의 기본 등급 사용
    const { data: company } = await supabase
      .from('companies')
      .select('default_commission_grade')
      .eq('id', companyId)
      .single();
    return company?.default_commission_grade || 'A';
  }

  // modified_commission_grade가 있으면 우선 사용, 없으면 company_default_commission_grade 사용
  return data.modified_commission_grade || data.company_default_commission_grade || 'A';
}

async function handleEditCalculations(rowData, field) {
  // 간단한 제품 검색 및 가격/수수료율 업데이트
  if (field === 'product') {
      const product = products.value.find(p => p.id === rowData.product_id_modify);
      if (product) {
          rowData.price_for_calc = product.price;
          
          // 프로모션 제품 확인:
          // 1. 제품이 promotion_product_list에 있는지 확인 (보험코드로)
          // 2. 해당 병원이 promotion_product_hospital_performance에 있는지 확인 (hospital_id로)
          // 3. 업체가 first_performance_cso_id와 동일한지 확인
          const insuranceCode = String(product.insurance_code || '');
          const hospitalId = rowData.client_id;
          const companyId = rowData.company_id;
          
          let commissionRate = 0;
          
          // promotion_product_hospital_performance 조회
          const { data: hospitalPerf, error: hospitalPerfError } = await supabase
            .from('promotion_product_hospital_performance')
            .select(`
              first_performance_cso_id,
              promotion_product_list!inner(insurance_code, final_commission_rate, promotion_start_date, promotion_end_date)
            `)
            .eq('hospital_id', hospitalId)
            .eq('has_performance', true);
          
          // 프로모션 제품이고 해당 병원에 실적이 있으며, 현재 업체가 first_performance_cso_id와 동일한 경우 final_commission_rate 사용
          if (!hospitalPerfError && hospitalPerf && hospitalPerf.length > 0) {
            const promotionProduct = hospitalPerf.find(hp => 
              String(hp.promotion_product_list?.insurance_code) === insuranceCode &&
              hp.first_performance_cso_id === companyId
            );
            
            if (promotionProduct && promotionProduct.promotion_product_list?.final_commission_rate !== undefined) {
              // 프로모션 기간 확인: 정산월이 프로모션 시작일과 종료일 사이에 포함되어야 함
              const promotionInfo = promotionProduct.promotion_product_list;
              const settlementMonth = rowData.settlement_month; // YYYY-MM 형식
              let isWithinPromotionPeriod = true;
              
              const settlementDate = new Date(settlementMonth + '-01'); // 정산월의 첫 날
              const lastDayOfSettlementMonth = new Date(settlementDate.getFullYear(), settlementDate.getMonth() + 1, 0); // 정산월의 마지막 날
              
              if (promotionInfo.promotion_start_date) {
                const startDate = new Date(promotionInfo.promotion_start_date);
                // 정산월의 첫 날이 시작일 이후 또는 같아야 함
                if (settlementDate < startDate) {
                  isWithinPromotionPeriod = false;
                }
              }
              
              if (promotionInfo.promotion_end_date) {
                const endDate = new Date(promotionInfo.promotion_end_date);
                // 정산월의 마지막 날이 종료일 이전 또는 같아야 함
                if (lastDayOfSettlementMonth > endDate) {
                  isWithinPromotionPeriod = false;
                }
              }
              
              // 프로모션 기간 내에 있는 경우에만 final_commission_rate 사용
              if (isWithinPromotionPeriod) {
                commissionRate = promotionInfo.final_commission_rate;
              }
            }
          }
          
          // 프로모션 제품이 아닌 경우 기존 로직 사용
          if (commissionRate === 0) {
            // 회사-거래처 매핑에서 수수료율 등급 조회
            const grade = await getCommissionGradeForClientCompany(rowData.company_id, rowData.client_id);
            if (grade === 'A') {
              commissionRate = product.commission_rate_a;
            } else if (grade === 'B') {
              commissionRate = product.commission_rate_b;
            } else if (grade === 'C') {
              commissionRate = product.commission_rate_c;
            } else if (grade === 'D') {
              commissionRate = product.commission_rate_d;
            } else if (grade === 'E') {
              commissionRate = product.commission_rate_e;
            }
          }
          
          // 수수료율을 퍼센트로 변환해서 표시 (소수점 0.36 -> 36)
          rowData.commission_rate_modify = commissionRate !== null && commissionRate !== undefined
            ? (commissionRate * 100).toFixed(1)
            : null;
      }
  }
  // 수수료율 검증 (100% 초과 방지)
  if (field === 'rate' && rowData.commission_rate_modify) {
    const commissionRateStr = String(rowData.commission_rate_modify).replace(/,/g, '').replace(/%/g, '');
    const commissionRateNum = Number(commissionRateStr);
    if (!isNaN(commissionRateNum) && commissionRateNum > 100) {
      showWarning('수수료율은 100%를 초과할 수 없습니다.');
      rowData.commission_rate_modify = '100';
    }
  }
  
  // 처방액, 지급 처방액, 지급액 계산
  const qty = Number(rowData.prescription_qty_modify) || 0;
  const price = Number(rowData.price_for_calc) || 0;
  const rate = convertCommissionRateToDecimal(rowData.commission_rate_modify);
  
  // 수수료율이 100%를 초과하는지 다시 한번 검증 (소수점 변환 후)
  if (rate > 1) {
    showWarning('수수료율은 100%를 초과할 수 없습니다.');
    rowData.commission_rate_modify = '100';
    // 100%로 재계산
    const correctedRate = 1;
    const prescriptionAmount = Math.round(qty * price);
    let paymentPrescriptionAmount = 0;
    let paymentAmount = 0;
    
    if (correctedRate > 0) {
      paymentPrescriptionAmount = prescriptionAmount;
      paymentAmount = Math.round(prescriptionAmount * correctedRate);
    }
    
    rowData.prescription_amount_modify = prescriptionAmount;
    rowData.payment_prescription_amount_modify = paymentPrescriptionAmount;
    rowData.payment_amount_modify = paymentAmount;
    rowData._raw_prescription_qty = qty;
    rowData._raw_prescription_amount = prescriptionAmount;
    rowData._raw_payment_prescription_amount = paymentPrescriptionAmount;
    rowData._raw_payment_amount = paymentAmount;
    return;
  }
  
  const prescriptionAmount = Math.round(qty * price);
  // 수수료율이 있고 0보다 클 때만 지급 처방액과 지급액 계산
  let paymentPrescriptionAmount = 0;
  let paymentAmount = 0;
  
  if (rate !== null && rate !== undefined && rate > 0) {
    paymentPrescriptionAmount = prescriptionAmount;
    paymentAmount = Math.round(prescriptionAmount * rate);
  }
  
  // 화면 표시용 포맷팅된 값
  rowData.prescription_amount_modify = prescriptionAmount;
  rowData.payment_prescription_amount_modify = paymentPrescriptionAmount;
  rowData.payment_amount_modify = paymentAmount;
  
  // 원본 데이터도 업데이트 (합계 계산용)
  rowData._raw_prescription_qty = qty;
  rowData._raw_prescription_amount = prescriptionAmount;
  rowData._raw_payment_prescription_amount = paymentPrescriptionAmount;
  rowData._raw_payment_amount = paymentAmount;
  
}

// 수수료율 입력 시 실시간 검증 (100% 초과 방지)
function handleCommissionRateInput(rowData) {
  if (!rowData.commission_rate_modify) return;
  
  const commissionRateStr = String(rowData.commission_rate_modify).replace(/,/g, '').replace(/%/g, '');
  const commissionRateNum = Number(commissionRateStr);
  
  if (!isNaN(commissionRateNum) && commissionRateNum > 100) {
    showWarning('수수료율은 100%를 초과할 수 없습니다.');
    rowData.commission_rate_modify = '100';
  }
}

function handleProductNameInput(rowData, event) {
  const reactiveRow = rows.value.find(r => r.id === rowData.id);
  if (!reactiveRow) return;

  reactiveRow.product_name_search = event.target.value;
  const searchTerm = event.target.value.toLowerCase();
  reactiveRow.showProductSearchList = true;

  const sourceList = reactiveRow.availableProducts || [];

  if (!searchTerm) {
    reactiveRow.productSearchResults = sourceList;
  } else {
    reactiveRow.productSearchResults = sourceList.filter(p =>
      p.product_name.toLowerCase().includes(searchTerm) ||
      (p.insurance_code && p.insurance_code.toLowerCase().includes(searchTerm))
    );
  }
  updateProductDropdownPosition(reactiveRow);
}

async function applySelectedProduct(product, rowData) {
    const reactiveRow = rows.value.find(r => r.id === rowData.id);
    if (!reactiveRow) return;

    reactiveRow.product_id_modify = product.id;
    reactiveRow.product_name_search = product.product_name;
    reactiveRow.product_name_display = product.product_name;
    reactiveRow.insurance_code = product.insurance_code;
    reactiveRow.price_for_calc = product.price;

    // 프로모션 제품 확인:
    // 1. 제품이 promotion_product_list에 있는지 확인 (보험코드로)
    // 2. 해당 병원이 promotion_product_hospital_performance에 있는지 확인 (hospital_id로)
    // 3. 업체가 first_performance_cso_id와 동일한지 확인
    const insuranceCode = String(product.insurance_code || '');
    const hospitalId = reactiveRow.client_id;
    const companyId = reactiveRow.company_id;
    
    let commissionRate = 0;
    
    // promotion_product_hospital_performance 조회
    const { data: hospitalPerf, error: hospitalPerfError } = await supabase
      .from('promotion_product_hospital_performance')
      .select(`
        first_performance_cso_id,
        promotion_product_list!inner(insurance_code, final_commission_rate, promotion_start_date, promotion_end_date)
      `)
      .eq('hospital_id', hospitalId)
      .eq('has_performance', true);
    
    // 프로모션 제품이고 해당 병원에 실적이 있으며, 현재 업체가 first_performance_cso_id와 동일한 경우 final_commission_rate 사용
    if (!hospitalPerfError && hospitalPerf && hospitalPerf.length > 0) {
      const promotionProduct = hospitalPerf.find(hp => 
        String(hp.promotion_product_list?.insurance_code) === insuranceCode &&
        hp.first_performance_cso_id === companyId
      );
      
      if (promotionProduct && promotionProduct.promotion_product_list?.final_commission_rate !== undefined) {
        // 프로모션 기간 확인 (정산월 기준)
        const promotionInfo = promotionProduct.promotion_product_list;
        const settlementMonth = reactiveRow.settlement_month; // YYYY-MM 형식
        
        if (settlementMonth) {
          // 프로모션 기간 확인: 정산월이 프로모션 시작일과 종료일 사이에 포함되어야 함
          let isWithinPromotionPeriod = true;
          
          const settlementDate = new Date(settlementMonth + '-01'); // 정산월의 첫 날
          const lastDayOfSettlementMonth = new Date(settlementDate.getFullYear(), settlementDate.getMonth() + 1, 0); // 정산월의 마지막 날
          
          if (promotionInfo.promotion_start_date) {
            const startDate = new Date(promotionInfo.promotion_start_date);
            // 정산월의 첫 날이 시작일 이후 또는 같아야 함
            if (settlementDate < startDate) {
              isWithinPromotionPeriod = false;
            }
          }
          
          if (promotionInfo.promotion_end_date) {
            const endDate = new Date(promotionInfo.promotion_end_date);
            // 정산월의 마지막 날이 종료일 이전 또는 같아야 함
            if (lastDayOfSettlementMonth > endDate) {
              isWithinPromotionPeriod = false;
            }
          }
          
          // 프로모션 기간 내에 있는 경우에만 final_commission_rate 사용
          if (isWithinPromotionPeriod) {
            commissionRate = promotionInfo.final_commission_rate;
          }
        } else {
          // 정산월이 없으면 프로모션 기간 확인 없이 적용
          commissionRate = promotionInfo.final_commission_rate;
        }
      }
    }
    
    // 프로모션 제품이 아닌 경우 기존 로직 사용
    if (commissionRate === 0) {
      // 회사-거래처 매핑에서 수수료율 등급 조회
      const grade = await getCommissionGradeForClientCompany(reactiveRow.company_id, reactiveRow.client_id);
      if (grade === 'A') {
        commissionRate = product.commission_rate_a;
      } else if (grade === 'B') {
        commissionRate = product.commission_rate_b;
      } else if (grade === 'C') {
        commissionRate = product.commission_rate_c;
      } else if (grade === 'D') {
        commissionRate = product.commission_rate_d;
      } else if (grade === 'E') {
        commissionRate = product.commission_rate_e;
      }
    }
    
    // 수수료율을 퍼센트로 변환해서 표시 (소수점 0.36 -> 36)
    reactiveRow.commission_rate_modify = commissionRate !== null && commissionRate !== undefined
      ? (commissionRate * 100).toFixed(1)
      : null;

    reactiveRow.showProductSearchList = false;
    handleEditCalculations(reactiveRow, 'product');
    
    // 제품 선택 시 원본 데이터도 업데이트
    reactiveRow._raw_prescription_qty = Number(reactiveRow.prescription_qty_modify) || 0;
}

function getRowClass(data) {
  return [
    { 'editing-row': data.isEditing },
    { 'added-row': data.review_action === '추가' },
    { 'modified-row': data.review_action === '수정' },
    { 'deleted-row': data.review_action === '삭제' },
    { 'promotion-rate-row': data.isPromotionRateApplied } // 프로모션 수수료율 적용된 행
  ];
}

function getActionSeverity(action) {
    if (action === '수정') return 'info';
    if (action === '추가') return 'success';
    if (action === '삭제') return 'danger';
    return 'secondary';
}

function getStatusSeverity(status) {
    if (status === '완료') return 'success';
    if (status === '검수중') return 'warning';
    if (status === '대기') return 'info';
    return 'secondary';
}

function getPrescriptionMonth(settlementMonth, offset) {
  if (!settlementMonth) return '';
  const [y, m] = settlementMonth.split('-');
  let mm = parseInt(m, 10) - offset;
  let yy = parseInt(y, 10);
  while (mm <= 0) { mm += 12; yy -= 1; }
  return `${yy}-${String(mm).padStart(2, '0')}`;
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);

    // UTC 기준으로 KST 계산 (브라우저 자동 변환 방지)
    const utcHours = date.getUTCHours();
    const kstHours = (utcHours + 9) % 24;

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(kstHours).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 페이지 변경 이벤트 핸들러
function onPageChange(event) {
  // 페이지 변경 시 선택된 행을 초기화
  selectedRows.value = [];
  // 페이지 정보 업데이트
  currentPageFirstIndex.value = event.first;
  rowsPerPage.value = event.rows;
}

// --- 제품 검색 관련 함수 ---
function handleProductNameFocus(rowData) {
  const reactiveRow = rows.value.find(r => r.id === rowData.id);
  if (!reactiveRow) return;

  const prescriptionMonth = reactiveRow.prescription_month_modify || reactiveRow.prescription_month;

  if (!prescriptionMonth) {
    return;
  }

  // 해당 처방월의 제품 목록이 없으면 먼저 불러오기
  if (!productsByMonth.value[prescriptionMonth]) {
    fetchProductsForMonth(prescriptionMonth).then(() => {
      const filteredList = getFilteredProductList(prescriptionMonth);
      reactiveRow.availableProducts = filteredList;
      reactiveRow.productSearchResults = filteredList;
      reactiveRow.showProductSearchList = true;
      updateProductDropdownPosition(reactiveRow);
    });
  } else {
    const filteredList = getFilteredProductList(prescriptionMonth);
    reactiveRow.availableProducts = filteredList;
    reactiveRow.productSearchResults = filteredList;
    reactiveRow.showProductSearchList = true;
    updateProductDropdownPosition(reactiveRow);
  }
}

function delayedHideProductSearchList(rowData) {
  const reactiveRow = rows.value.find(r => r.id === rowData.id);
  if (!reactiveRow) return;

  setTimeout(() => {
    reactiveRow.showProductSearchList = false;
  }, 200);
}

function updateProductDropdownPosition(rowData) {
  const reactiveRow = rows.value.find(r => r.id === rowData.id);
  if (!reactiveRow) return;

  nextTick(() => {
    const inputEl = productInputRefs.value[reactiveRow.id];
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect();
      reactiveRow.productDropdownStyle = {
        position: 'fixed',
        top: `${rect.bottom}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 1000
      };
    }
  });
}

// --- 제품 검색 헬퍼 ---
function getFilteredProductList(prescriptionMonth) {
  if (!prescriptionMonth) {
    return [];
  }

  // 해당 처방월의 제품 목록 가져오기 (없으면 자동으로 불러옴)
  if (!productsByMonth.value[prescriptionMonth]) {
    fetchProductsForMonth(prescriptionMonth);
    return [];
  }

  const productList = productsByMonth.value[prescriptionMonth] || [];

  return productList;
}

// --- 처방월 변경 시 제품 정보 업데이트 ---
async function updateProductInfoForMonthChange(rowData) {
  const reactiveRow = rows.value.find(r => r.id === rowData.id);
  if (!reactiveRow || !reactiveRow.insurance_code || !reactiveRow.prescription_month_modify) return;

  try {
    // 보험코드로 새 처방월에서 해당 제품 정보 조회
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('insurance_code', reactiveRow.insurance_code)
      .eq('base_month', reactiveRow.prescription_month_modify)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('제품 조회 오류:', error);
      return;
    }

    if (!data || data.length === 0) {
      // 새 처방월에 해당 제품이 없으면 제품 선택 해제
      reactiveRow.product_id_modify = null;
      reactiveRow.product_name_search = '';
      reactiveRow.product_name_display = '';
      reactiveRow.insurance_code = '';
      reactiveRow.price_for_calc = 0;
      reactiveRow.commission_rate_modify = null;
      reactiveRow.prescription_amount_modify = 0;
      reactiveRow.payment_amount_modify = 0;
      return;
    }

    const productData = data[0]; // 첫 번째 결과 사용

    // 새 처방월에 해당 제품이 있으면 정보 업데이트

    reactiveRow.product_id_modify = productData.id;
    reactiveRow.product_name_search = productData.product_name;
    reactiveRow.product_name_display = productData.product_name;
    reactiveRow.insurance_code = productData.insurance_code;
    reactiveRow.price_for_calc = productData.price || 0;

    // 회사-거래처 매핑에서 수수료율 등급 조회
    const grade = await getCommissionGradeForClientCompany(reactiveRow.company_id, reactiveRow.client_id);
    let commissionRate = 0;
    if (grade === 'A') {
      commissionRate = productData.commission_rate_a;
    } else if (grade === 'B') {
      commissionRate = productData.commission_rate_b;
    }
    // 수수료율을 퍼센트로 변환해서 표시 (소수점 0.36 -> 36)
    reactiveRow.commission_rate_modify = commissionRate !== null && commissionRate !== undefined
      ? (commissionRate * 100).toFixed(1)
      : null;

    // 처방수량이 있으면 처방액 재계산
    if (reactiveRow.prescription_qty_modify) {
      const qty = Number(reactiveRow.prescription_qty_modify);
      const price = Number(productData.price) || 0;
      if (!isNaN(qty) && !isNaN(price) && price > 0) {
        const prescriptionAmount = qty * price;
        const paymentPrescriptionAmount = (commissionRate > 0) ? prescriptionAmount : 0;
        const paymentAmount = prescriptionAmount * (commissionRate / 100);
        
        // 화면 표시용 값 업데이트
        reactiveRow.prescription_amount_modify = prescriptionAmount;
        reactiveRow.payment_prescription_amount_modify = paymentPrescriptionAmount;
        reactiveRow.payment_amount_modify = paymentAmount;
        
        // 원본 데이터도 업데이트
        reactiveRow._raw_prescription_qty = qty;
        reactiveRow._raw_prescription_amount = prescriptionAmount;
        reactiveRow._raw_payment_prescription_amount = paymentPrescriptionAmount;
        reactiveRow._raw_payment_amount = paymentAmount;
      }
    }
  } catch (err) {
    console.error('제품 정보 업데이트 오류:', err);
  }
}


const prescriptionTypeOptionsForBulk = [
  'EDI',
  'ERP직거래자료',
  '매출자료',
  '약국조제',
  '원내매출',
  '원외매출',
  '차감'
];

// --- 일괄 변경 관련 함수들 ---
function openBulkChangeModal() {
  selectedBulkChangeType.value = '';
  selectedBulkChangeValue.value = '';
  showBulkChangeModal.value = true;
}

function closeBulkChangeModal() {
  showBulkChangeModal.value = false;
  selectedBulkChangeType.value = '';
  selectedBulkChangeValue.value = '';
}

function openBulkChangeValueModal() {
  if (!selectedBulkChangeType.value) return;
  selectedBulkChangeValue.value = '';
  showBulkChangeValueModal.value = true;
}

function closeBulkChangeValueModal() {
  showBulkChangeValueModal.value = false;
  selectedBulkChangeValue.value = '';
}

function getBulkChangeTypeLabel() {
  switch (selectedBulkChangeType.value) {
    case 'company_name':
      return '업체명';
    case 'prescription_type':
      return '처방구분';
    default:
      return '';
  }
}

async function handleBulkChange() {
  if (!selectedRows.value || selectedRows.value.length === 0 || !selectedBulkChangeType.value || !selectedBulkChangeValue.value) return;

  const ids = selectedRows.value.map(row => row.id);
  const updateData = {};

  try {
    switch (selectedBulkChangeType.value) {
      case 'company_name':
        // 업체명 변경 시 company_id도 함께 업데이트
        const selectedCompany = monthlyCompanies.value.find(company => company.company_name === selectedBulkChangeValue.value);
        if (selectedCompany) {
          updateData.company_id = selectedCompany.id;

          // 선택된 실적 기록들의 client_id를 가져와서 매핑 관계 확인 및 추가

          const { data: performanceRecords, error: fetchError } = await supabase
            .from('performance_records')
            .select('client_id')
            .in('id', ids);

          if (fetchError) {
            throw new Error(`실적 기록 조회 실패: ${fetchError.message}`);
          }


          // 고유한 client_id 목록 생성
          const uniqueClientIds = [...new Set(performanceRecords.map(record => record.client_id).filter(id => id))];

          // 각 client_id에 대해 매핑 관계 확인 및 추가
          for (const clientId of uniqueClientIds) {

            // 기존 매핑 관계 확인
            const { data: existingMapping, error: mappingError } = await supabase
              .from('client_company_assignments')
              .select('id')
              .eq('client_id', clientId)
              .eq('company_id', selectedCompany.id)
              .single();


            if (mappingError && mappingError.code !== 'PGRST116') { // PGRST116는 결과가 없는 경우
              console.error(`매핑 관계 확인 오류 (client_id: ${clientId}, company_id: ${selectedCompany.id}):`, mappingError);
            }

            // 매핑 관계가 없으면 새로 추가
            if (!existingMapping) {

              const currentUser = await supabase.auth.getUser();

              const insertData = {
                client_id: clientId,
                company_id: selectedCompany.id,
                created_by: currentUser.data.user?.id
              };

              const { error: insertError } = await supabase
                .from('client_company_assignments')
                .insert(insertData);

              if (insertError) {
                console.error(`매핑 관계 추가 실패 (client_id: ${clientId}, company_id: ${selectedCompany.id}):`, insertError);
                // 매핑 추가 실패해도 실적 기록 업데이트는 계속 진행
              } else {
              }
            } else {
            }
          }
        }
        break;
      case 'prescription_type':
        updateData.prescription_type = selectedBulkChangeValue.value;
        break;
    }

    // 모든 일괄 변경에 review_action을 '수정'으로 설정하고 updated_at, updated_by를 현재 시간과 사용자로 설정
    updateData.review_action = '수정';
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = (await supabase.auth.getUser()).data.user?.id;

    const { error } = await supabase
      .from('performance_records')
      .update(updateData)
      .in('id', ids);

    if (error) {
      showError(`${getBulkChangeTypeLabel()} 변경 실패: ${error.message}`);
    } else {
      showSuccess(`${getBulkChangeTypeLabel()}이 성공적으로 변경되었습니다.`);
      await loadPerformanceData();
    }
  } catch (e) {
    showError(`${getBulkChangeTypeLabel()} 변경 중 오류 발생: ${e.message}`);
  } finally {
    closeBulkChangeValueModal();
    closeBulkChangeModal();
  }
}
</script>

<style scoped>
/* ... 다른 스타일들 ... */

.product-search-list {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.product-search-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.product-search-item:hover {
  background-color: #f0f0f0;
}

.product-search-item.selected {
  background-color: #e0e0e0;
}

.product-search-item .product-name {
  font-weight: 500;
}

.product-search-item .insurance-code {
  color: #666;
  font-size: 0.9em;
}

:deep(.row-added .p-frozen-column),
:deep(.row-added td) {
  background-color: #e3f2fd !important; /* 아주 연한 파란색 */
}

:deep(.row-modified .p-frozen-column),
:deep(.row-modified td) {
  background-color: #fffde7 !important; /* 아주 연한 노란색 */
}

:deep(.deleted-row .p-frozen-column),
:deep(.deleted-row td) {
  background-color: #ffebee !important; /* 아주 연한 붉은색 */
}

/* No와 액션 열에서는 취소선 제거 */
:deep(.deleted-row td:first-child),
:deep(.deleted-row td:nth-child(4)) {
  text-decoration: none !important;
}

:deep(.p-datatable-tfoot > tr > td) {
    background: #f8f9fa !important;
}

:deep(.p-datatable .p-datatable-tbody > tr.p-highlight) {
    background-color: #eff6ff;
    color: #1d4ed8;
}

/* 기존 배경색 규칙을 삭제하고 아래의 더 구체적인 규칙으로 대체합니다. */
:deep(.p-datatable .p-datatable-tbody > tr.added-row > td) {
  background-color: #e3f2fd !important; /* 아주 연한 파란색 */
}

:deep(.p-datatable .p-datatable-tbody > tr.modified-row > td) {
  background-color: #fffde7 !important; /* 아주 연한 노란색 */
}

:deep(.p-datatable .p-datatable-tbody > tr.deleted-row > td) {
  background-color: #ffebee !important; /* 아주 연한 붉은색 */
  color: #999 !important;
  text-decoration: line-through !important;
}

/* 프로모션 수수료율 적용된 행 배경색 */
:deep(.p-datatable .p-datatable-tbody > tr.promotion-rate-row > td) {
  background-color: #f3e5f5 !important; /* 아주 연한 보라색 */
}

/* 프로모션 수수료율이 적용되고 추가/수정/삭제 작업이 있는 경우 우선순위 조정 */
:deep(.p-datatable .p-datatable-tbody > tr.promotion-rate-row.added-row > td) {
  background-color: #e1bee7 !important; /* 프로모션 + 추가: 약간 진한 보라색 */
}

:deep(.p-datatable .p-datatable-tbody > tr.promotion-rate-row.modified-row > td) {
  background-color: #f1c0f7 !important; /* 프로모션 + 수정: 약간 진한 보라색 */
}

:deep(.p-datatable .p-datatable-tbody > tr.promotion-rate-row.deleted-row > td) {
  background-color: #ffebee !important; /* 삭제 우선: 연한 붉은색 */
  color: #999 !important;
  text-decoration: line-through !important;
}

:deep(.p-datatable-tfoot > tr > td) {
    background: #f8f9fa !important;
    font-weight: bold;
}

/* 병의원 검색 드롭다운 스타일 */
.hospital-search-container {
  position: relative;
}

.hospital-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  max-height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
  z-index: 1000;
}

.hospital-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.hospital-dropdown-item:hover {
  background-color: #f0f0f0;
}

.hospital-dropdown-item.selected {
  background-color: #e3f2fd;
  color: #1976d2;
}

.hospital-dropdown-item.highlighted {
  background-color: #f0f8ff;
  color: #1976d2;
}

.hospital-dropdown-item.no-results {
  color: #999;
  font-style: italic;
  cursor: default;
}

.hospital-dropdown-item:last-child {
  border-bottom: none;
}

/* 업체 검색 드롭다운 스타일 */
.company-search-container {
  position: relative;
}

.company-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  max-height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
  z-index: 1000;
}

.company-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.company-dropdown-item:hover {
  background-color: #f0f0f0;
}

.company-dropdown-item.selected {
  background-color: #e3f2fd;
  color: #1976d2;
}

.company-dropdown-item.highlighted {
  background-color: #f0f8ff;
  color: #1976d2;
}

.company-dropdown-item.no-results {
  color: #999;
  font-style: italic;
  cursor: default;
}

.company-dropdown-item:last-child {
  border-bottom: none;
}

/* 지급 처방액, 지급액 컬럼 우측 정렬 강제 적용 */
:deep(.p-datatable-tbody > tr > td:nth-child(12)),
:deep(.p-datatable-tbody > tr > td:nth-child(15)) {
  text-align: right !important;
}

/* 프로모션 데이터 업데이트 버튼 스타일 */
.btn-check {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  font-weight: 500;
}

.btn-check:hover:not(:disabled) {
  background-color: #218838;
}

.btn-check:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 데이터 업데이트 진행 모달 스타일 */
.progress-container {
  position: relative;
  margin-bottom: 8px;
}

.progress-bar-wrapper {
  width: 100%;
  height: 28px;
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #0056b3 50%, #004085 100%);
  border-radius: 14px;
  position: relative;
  transition: width 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
  overflow: hidden;
}

.progress-bar-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

.progress-bar-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.progress-steps {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  justify-content: space-between;
}

.progress-step {
  flex: 1;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.progress-step.active {
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
  transform: scaleY(1.5);
}

.info-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-left-color: #007bff;
}

.status-card {
  background: linear-gradient(135deg, #e7f3ff 0%, #d1ecf1 100%);
  border-left-color: #17a2b8;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e9ecef;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
