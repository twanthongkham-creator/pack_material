const SUPABASE_URL = "https://bdjyxkkzbbzlmxszmvhx.supabase.co";
const SUPABASE_KEY = "sb_publishable_inYG_le-QyiIvjkaUHXyfQ_Nvm4FpR2";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class Storage {
  constructor() {
    this.products = [];
    this.categories = [];
    this.masterPackmat = [];
    this.receivingPlans = [];
    this.productionRuns = [];
    this.productionRunItems = [];
  }

  async fetchAll() {
    try {
      const { data: catData, error: catErr } = await sb.from('categories').select('*');
      if (!catErr && catData) {
        this.categories = catData;
        this.sortArray(this.categories);
      } else if (catErr) {
        console.error("Error fetching categories:", catErr);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data: prodData, error: prodErr } = await sb.from('products').select('*');
      if (!prodErr && prodData) {
        this.products = prodData.map(p => ({
          ...p,
          id: Number(p.id),
          category: p.category ? Number(p.category) : p.category
        }));
        this.sortArray(this.products);
      } else if (prodErr) {
        console.error("Error fetching products:", prodErr);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data: packmatData, error: packmatErr } = await sb.from('master_packmat').select('*');
      if (!packmatErr && packmatData) {
        this.masterPackmat = packmatData.map(pm => ({
          material: Number(pm.material),
          material_name: pm.material_name,
          material_desc: pm.material_desc,
          material_group: pm.material_group,
          type: pm.type,
          category: pm.category,
          pallet_unit: pm.pallet_unit !== null && pm.pallet_unit !== undefined ? Number(pm.pallet_unit) : null,
          layer_unit: pm.layer_unit !== null && pm.layer_unit !== undefined ? Number(pm.layer_unit) : null,
          shelf_life: pm.shelf_life !== null && pm.shelf_life !== undefined ? Number(pm.shelf_life) : null,
          updated_at: pm.updated_at
        }));
      } else if (packmatErr) {
        console.error("Error fetching master_packmat:", packmatErr);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data: planData, error: planErr } = await sb.from('receiving_plans').select('*');
      if (!planErr && planData) {
        this.receivingPlans = planData.map(p => ({
          ...p,
          id: Number(p.id),
          material: Number(p.material),
          planned_pallets: Number(p.planned_pallets) || 0,
          received_pallets: Number(p.received_pallets) || 0
        }));
      } else if (planErr) {
        // Table may not exist yet if the migration hasn't been run — fail quietly
        // so the rest of the app still works.
        console.error("Error fetching receiving_plans:", planErr);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data: runData, error: runErr } = await sb.from('production_runs').select('*');
      if (!runErr && runData) {
        this.productionRuns = runData.map(r => ({
          ...r,
          id: Number(r.id)
        }));
      } else if (runErr) {
        // Table may not exist yet if the migration hasn't been run — fail quietly
        // so the rest of the app still works.
        console.error("Error fetching production_runs:", runErr);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data: itemData, error: itemErr } = await sb.from('production_run_items').select('*');
      if (!itemErr && itemData) {
        this.productionRunItems = itemData.map(i => ({
          ...i,
          id: Number(i.id),
          run_id: Number(i.run_id),
          material: Number(i.material),
          required_pallets: Number(i.required_pallets) || 0,
          required_layers: Number(i.required_layers) || 0
        }));
      } else if (itemErr) {
        console.error("Error fetching production_run_items:", itemErr);
      }
    } catch (e) {
      console.error(e);
    }
  }

  getProducts() {
    return this.products;
  }

  getCategories() {
    return this.categories;
  }

  getMasterPackmat() {
    return this.masterPackmat;
  }

  getReceivingPlans() {
    return this.receivingPlans;
  }

  getProductionRuns() {
    return this.productionRuns;
  }

  getProductionRunItems() {
    return this.productionRunItems;
  }

  async saveCategorie(data) {
    if (data.id != 0) {
      const existed = this.categories.find((category) => category.id == data.id);
      if (existed) {
        existed.title = data.title;
        existed.description = data.description;
        existed.updated = new Date().toISOString();
        await sb.from('categories').update({
          title: data.title,
          description: data.description,
          updated: existed.updated
        }).eq('id', data.id);
      } else {
        data.updated = new Date().toISOString();
        this.categories.push(data);
        await sb.from('categories').insert(data);
      }
    } else {
      const existed = this.categories.find(
        (category) =>
          category.title.toLowerCase().trim() == data.title.toLowerCase().trim()
      );

      if (existed) {
        existed.title = data.title;
        existed.description = data.description;
        existed.updated = new Date().toISOString();
        await sb.from('categories').update({
          title: data.title,
          description: data.description,
          updated: existed.updated
        }).eq('id', existed.id);
      } else {
        data.id = new Date().getTime();
        data.updated = new Date().toISOString();
        this.categories.push(data);
        await sb.from('categories').insert(data);
      }
    }
    this.sortArray(this.categories);
  }

  async saveProduct(data) {
    const dbCategory = (data.category && data.category !== 'no-cat') ? Number(data.category) : null;
    if (data.id != 0) {
      const existed = this.products.find((product) => product.id == data.id);
      if (existed) {
        existed.title = data.title;
        existed.category = dbCategory;
        existed.quantity = Number(data.quantity);
        existed.price = Number(data.price);
        existed.updated = new Date().toISOString();
        await sb.from('products').update({
          title: existed.title,
          category: existed.category,
          quantity: existed.quantity,
          price: existed.price,
          updated: existed.updated
        }).eq('id', data.id);
      } else {
        data.updated = new Date().toISOString();
        data.category = dbCategory;
        data.quantity = Number(data.quantity);
        data.price = Number(data.price);
        this.products.push(data);
        await sb.from('products').insert(data);
      }
    } else {
      const existed = this.products.find(
        (product) =>
          product.title.toLowerCase().trim() == data.title.toLowerCase().trim()
      );

      if (existed) {
        existed.title = data.title;
        existed.category = dbCategory;
        existed.quantity = Number(data.quantity);
        existed.price = Number(data.price);
        existed.updated = new Date().toISOString();
        await sb.from('products').update({
          title: existed.title,
          category: existed.category,
          quantity: existed.quantity,
          price: existed.price,
          updated: existed.updated
        }).eq('id', existed.id);
      } else {
        data.id = new Date().getTime();
        data.updated = new Date().toISOString();
        const newProd = {
          id: data.id,
          title: data.title,
          category: dbCategory,
          quantity: Number(data.quantity),
          price: Number(data.price),
          updated: data.updated
        };
        this.products.push(newProd);
        await sb.from('products').insert(newProd);
      }
    }
    this.sortArray(this.products);
  }

  async upsertProducts(productsList) {
    const { error } = await sb.from('products').upsert(productsList);
    if (error) throw error;

    productsList.forEach(newP => {
      const idx = this.products.findIndex(p => p.id === newP.id);
      if (idx !== -1) {
        this.products[idx] = newP;
      } else {
        this.products.push(newP);
      }
    });
    this.sortArray(this.products);
  }

  async upsertMasterPackmat(packmatList) {
    const { error } = await sb.from('master_packmat').upsert(packmatList);
    if (error) throw error;

    packmatList.forEach(newPm => {
      const idx = this.masterPackmat.findIndex(pm => pm.material === newPm.material);
      if (idx !== -1) {
        this.masterPackmat[idx] = newPm;
      } else {
        this.masterPackmat.push(newPm);
      }
    });
  }

  sortArray(array) {
    array.sort((a, b) => (new Date(a.updated) < new Date(b.updated) ? 1 : -1));
  }

  // ---------------- Stock recording (บันทึกยอด / stock.html) ----------------

  // Update the packing-unit conversion factors (units per pallet / per layer) for a
  // single material in master_packmat, and keep the local cache in sync.
  async updateMasterUnits(material, palletUnit, layerUnit) {
    const materialId = Number(material);
    const payload = {
      pallet_unit: palletUnit === '' || palletUnit === null || palletUnit === undefined ? null : Number(palletUnit),
      layer_unit: layerUnit === '' || layerUnit === null || layerUnit === undefined ? null : Number(layerUnit)
    };
    const { error } = await sb.from('master_packmat').update(payload).eq('material', materialId);
    if (error) throw error;

    const existed = this.masterPackmat.find(pm => pm.material === materialId);
    if (existed) {
      existed.pallet_unit = payload.pallet_unit;
      existed.layer_unit = payload.layer_unit;
    }
  }

  // Full master-record edit from master.html: name, description, group, type and
  // packing units. Category is intentionally left untouched (it's always
  // "Packaging" in this dataset and is no longer shown/edited in the UI).
  async updateMasterRecord(material, fields) {
    const materialId = Number(material);
    const payload = {
      material_name: fields.material_name || '',
      material_desc: fields.material_desc || '',
      material_group: fields.material_group || '',
      type: fields.type || '',
      pallet_unit: fields.pallet_unit === '' || fields.pallet_unit === null || fields.pallet_unit === undefined ? null : Number(fields.pallet_unit),
      layer_unit: fields.layer_unit === '' || fields.layer_unit === null || fields.layer_unit === undefined ? null : Number(fields.layer_unit),
      shelf_life: fields.shelf_life === '' || fields.shelf_life === null || fields.shelf_life === undefined ? null : Number(fields.shelf_life)
    };

    const { error } = await sb.from('master_packmat').update(payload).eq('material', materialId);
    if (error) throw error;

    const existed = this.masterPackmat.find(pm => pm.material === materialId);
    if (existed) Object.assign(existed, payload);

    // keep the products table's display title (used on index.html) in sync
    const product = this.products.find(p => p.id === materialId);
    if (product && payload.material_name && product.title !== payload.material_name) {
      const { error: prodError } = await sb.from('products').update({ title: payload.material_name }).eq('id', materialId);
      if (!prodError) product.title = payload.material_name;
    }
  }

  // Save (or create) the latest stock count for a material. This always overwrites the
  // previous value on the products table — no per-day history is kept by design.
  async saveStockEntry(entry) {
    const materialId = Number(entry.material);
    const existingProduct = this.products.find(p => p.id === materialId);
    const masterInfo = this.masterPackmat.find(pm => pm.material === materialId);

    const palletCount = Number(entry.pallet_count) || 0;
    const layerCount = Number(entry.layer_count) || 0;
    const quantity = palletCount * (Number(entry.pallet_unit) || 0) + layerCount * (Number(entry.layer_unit) || 0);
    const nowStr = new Date().toISOString();

    const payload = {
      id: materialId,
      title: (masterInfo && masterInfo.material_name) || (existingProduct && existingProduct.title) || String(materialId),
      category: existingProduct ? existingProduct.category : null,
      quantity: quantity,
      price: existingProduct ? existingProduct.price : 0,
      pallet_count: palletCount,
      layer_count: layerCount,
      production_date: entry.production_date || null,
      best_before: entry.best_before || null,
      note: entry.note || null,
      stock_updated_at: nowStr,
      updated: nowStr
    };

    const { error } = await sb.from('products').upsert(payload);
    if (error) throw error;

    const idx = this.products.findIndex(p => p.id === materialId);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...payload };
    } else {
      this.products.push(payload);
    }

    return payload;
  }

  // Merge master_packmat with the latest products data so pages can show one row per
  // material with unit config + latest counted stock, without needing a DB join.
  getMergedStock() {
    return this.masterPackmat.map(pm => {
      const product = this.products.find(p => p.id === pm.material);
      return {
        material: pm.material,
        material_name: pm.material_name,
        material_desc: pm.material_desc,
        material_group: pm.material_group,
        type: pm.type,
        pallet_unit: pm.pallet_unit,
        layer_unit: pm.layer_unit,
        shelf_life: pm.shelf_life,
        pallet_count: product ? Number(product.pallet_count) || 0 : 0,
        layer_count: product ? Number(product.layer_count) || 0 : 0,
        quantity: product ? Number(product.quantity) || 0 : 0,
        production_date: product ? product.production_date : null,
        best_before: product ? product.best_before : null,
        note: product ? product.note : null,
        stock_updated_at: product ? product.stock_updated_at : null,
        recorded: !!(product && product.stock_updated_at)
      };
    });
  }

  async deleteProduct(id) {
    this.products = this.products.filter((product) => product.id != id);
    await sb.from('products').delete().eq('id', id);
  }

  async deleteCategory(id) {
    this.categories = this.categories.filter((category) => category.id != id);
    await sb.from('categories').delete().eq('id', id);
  }

  // ---------------- Incoming-delivery planning (planning.html) ----------------

  // Merge receiving_plans with master_packmat so pages can show material name/type
  // without a DB join, same pattern as getMergedStock().
  getMergedPlans() {
    return this.receivingPlans.map(plan => {
      const pm = this.masterPackmat.find(m => m.material === plan.material);
      return {
        ...plan,
        material_name: pm ? pm.material_name : String(plan.material),
        type: pm ? pm.type : '',
        material_group: pm ? pm.material_group : ''
      };
    });
  }

  computePlanStatus(plannedPallets, receivedPallets) {
    if (receivedPallets <= 0) return 'pending';
    if (receivedPallets >= plannedPallets) return 'complete';
    return 'partial';
  }

  // Create a new incoming-delivery plan.
  async createPlan(data) {
    const nowStr = new Date().toISOString();
    const planned = Number(data.planned_pallets) || 0;
    const payload = {
      id: Date.now(),
      material: Number(data.material),
      plan_date: data.plan_date,
      plan_time: data.plan_time || null,
      planned_pallets: planned,
      received_pallets: 0,
      status: 'pending',
      note: data.note || null,
      created_at: nowStr,
      updated_at: nowStr
    };

    const { error } = await sb.from('receiving_plans').insert(payload);
    if (error) throw error;

    this.receivingPlans.push(payload);
    return payload;
  }

  async updatePlan(id, fields) {
    const planId = Number(id);
    const payload = {
      plan_date: fields.plan_date,
      plan_time: fields.plan_time || null,
      planned_pallets: Number(fields.planned_pallets) || 0,
      note: fields.note || null,
      updated_at: new Date().toISOString()
    };

    const existed = this.receivingPlans.find(p => p.id === planId);
    if (existed) {
      payload.status = this.computePlanStatus(payload.planned_pallets, existed.received_pallets);
    }

    const { error } = await sb.from('receiving_plans').update(payload).eq('id', planId);
    if (error) throw error;

    if (existed) Object.assign(existed, payload);
    return existed;
  }

  // Log a newly-arrived batch (in full pallets) against a plan. This both bumps the
  // plan's running received_pallets total AND increases the material's live stock
  // pallet_count/quantity on products, so stock.html reflects the delivery right away
  // (the next physical count on stock.html will simply overwrite it with the true
  // count, same as any other stock save).
  async receivePlanQty(planId, addedPallets) {
    const id = Number(planId);
    const added = Number(addedPallets) || 0;
    if (added <= 0) throw new Error("จำนวนที่รับต้องมากกว่า 0");

    const plan = this.receivingPlans.find(p => p.id === id);
    if (!plan) throw new Error("ไม่พบแผนรับเข้านี้");

    const newReceived = (Number(plan.received_pallets) || 0) + added;
    const status = this.computePlanStatus(plan.planned_pallets, newReceived);
    const nowStr = new Date().toISOString();

    const planPayload = {
      received_pallets: newReceived,
      status,
      updated_at: nowStr
    };

    const { error: planError } = await sb.from('receiving_plans').update(planPayload).eq('id', id);
    if (planError) throw planError;

    Object.assign(plan, planPayload);

    // Bump the live product stock for this material by the same amount.
    const materialId = plan.material;
    const masterInfo = this.masterPackmat.find(pm => pm.material === materialId);
    const existingProduct = this.products.find(p => p.id === materialId);

    const palletUnit = masterInfo ? Number(masterInfo.pallet_unit) || 0 : 0;
    const layerUnit = masterInfo ? Number(masterInfo.layer_unit) || 0 : 0;
    const prevPalletCount = existingProduct ? Number(existingProduct.pallet_count) || 0 : 0;
    const layerCount = existingProduct ? Number(existingProduct.layer_count) || 0 : 0;
    const newPalletCount = prevPalletCount + added;
    const quantity = newPalletCount * palletUnit + layerCount * layerUnit;

    const productPayload = {
      id: materialId,
      title: (masterInfo && masterInfo.material_name) || (existingProduct && existingProduct.title) || String(materialId),
      category: existingProduct ? existingProduct.category : null,
      quantity,
      price: existingProduct ? existingProduct.price : 0,
      pallet_count: newPalletCount,
      layer_count: layerCount,
      production_date: existingProduct ? existingProduct.production_date : null,
      best_before: existingProduct ? existingProduct.best_before : null,
      note: existingProduct ? existingProduct.note : null,
      stock_updated_at: nowStr,
      updated: nowStr
    };

    const { error: prodError } = await sb.from('products').upsert(productPayload);
    if (prodError) throw prodError;

    const idx = this.products.findIndex(p => p.id === materialId);
    if (idx !== -1) {
      this.products[idx] = { ...this.products[idx], ...productPayload };
    } else {
      this.products.push(productPayload);
    }

    return plan;
  }

  async deletePlan(id) {
    this.receivingPlans = this.receivingPlans.filter(p => p.id != id);
    await sb.from('receiving_plans').delete().eq('id', id);
  }

  // ---------------- Daily production planning (production.html) ----------------

  // Merge each production run with its material line items, master_packmat info,
  // and the material's current live stock, so the page can show — per item —
  // whether there's enough remaining stock to cover what the run needs, without a
  // DB join. Comparison is done in base "quantity" units (same unit used across
  // the rest of the app) so partial-pallet/layer mixes still compare correctly.
  getMergedProductionRuns() {
    return this.productionRuns.map(run => {
      const items = this.productionRunItems
        .filter(i => i.run_id === run.id)
        .map(item => {
          const pm = this.masterPackmat.find(m => m.material === item.material);
          const product = this.products.find(p => p.id === item.material);
          const palletUnit = pm ? Number(pm.pallet_unit) || 0 : 0;
          const layerUnit = pm ? Number(pm.layer_unit) || 0 : 0;
          const requiredQuantity = item.required_pallets * palletUnit + item.required_layers * layerUnit;
          const currentQuantity = product ? Number(product.quantity) || 0 : 0;
          const remainingQuantity = currentQuantity - requiredQuantity;

          return {
            ...item,
            material_name: pm ? pm.material_name : String(item.material),
            type: pm ? pm.type : '',
            material_group: pm ? pm.material_group : '',
            pallet_unit: palletUnit,
            layer_unit: layerUnit,
            required_quantity: requiredQuantity,
            current_pallet_count: product ? Number(product.pallet_count) || 0 : 0,
            current_layer_count: product ? Number(product.layer_count) || 0 : 0,
            current_quantity: currentQuantity,
            remaining_quantity: remainingQuantity,
            sufficient: remainingQuantity >= 0
          };
        });

      const allSufficient = items.length > 0 && items.every(i => i.sufficient);

      return {
        ...run,
        items,
        allSufficient
      };
    });
  }

  // Create a new production run header plus its material line items in one call.
  // If the item insert fails, the run header is rolled back so we never leave an
  // orphaned header with zero items.
  async createProductionRun(data) {
    const nowStr = new Date().toISOString();
    const runId = Date.now();

    const runPayload = {
      id: runId,
      run_date: data.run_date,
      product_name: data.product_name,
      note: data.note || null,
      status: 'pending',
      confirmed_at: null,
      created_at: nowStr,
      updated_at: nowStr
    };

    const { error: runError } = await sb.from('production_runs').insert(runPayload);
    if (runError) throw runError;

    const itemPayloads = (data.items || []).map((it, idx) => ({
      id: runId + idx + 1,
      run_id: runId,
      material: Number(it.material),
      required_pallets: Number(it.required_pallets) || 0,
      required_layers: Number(it.required_layers) || 0,
      created_at: nowStr
    }));

    if (itemPayloads.length > 0) {
      const { error: itemError } = await sb.from('production_run_items').insert(itemPayloads);
      if (itemError) {
        await sb.from('production_runs').delete().eq('id', runId);
        throw itemError;
      }
    }

    this.productionRuns.push(runPayload);
    this.productionRunItems.push(...itemPayloads);

    return runPayload;
  }

  async deleteProductionRun(id) {
    const runId = Number(id);
    this.productionRuns = this.productionRuns.filter(r => r.id !== runId);
    this.productionRunItems = this.productionRunItems.filter(i => i.run_id !== runId);
    const { error } = await sb.from('production_runs').delete().eq('id', runId);
    if (error) throw error;
    // production_run_items cascade-delete in the DB via FK (ON DELETE CASCADE);
    // the local cache above is already filtered to match.
  }

  // Mark a production run as confirmed and deduct every line item's required
  // pallet/layer quantity straight from that material's live stock on products.
  // This intentionally does NOT block on insufficient stock — it still deducts
  // (which can leave a negative pallet/layer count) because the goal is visible,
  // honest tracking of what was actually used, not gatekeeping the production
  // floor. Insufficiency is surfaced as a warning in the UI before this is called.
  async confirmProductionRun(id) {
    const runId = Number(id);
    const run = this.productionRuns.find(r => r.id === runId);
    if (!run) throw new Error("ไม่พบแผนการผลิตนี้");
    if (run.status === 'confirmed') throw new Error("แผนนี้ยืนยันผลิตไปแล้ว");

    const items = this.productionRunItems.filter(i => i.run_id === runId);
    if (items.length === 0) throw new Error("แผนนี้ไม่มีรายการวัสดุ");

    const nowStr = new Date().toISOString();
    const productPayloads = items.map(item => {
      const materialId = item.material;
      const masterInfo = this.masterPackmat.find(pm => pm.material === materialId);
      const existingProduct = this.products.find(p => p.id === materialId);

      const palletUnit = masterInfo ? Number(masterInfo.pallet_unit) || 0 : 0;
      const layerUnit = masterInfo ? Number(masterInfo.layer_unit) || 0 : 0;
      const prevPalletCount = existingProduct ? Number(existingProduct.pallet_count) || 0 : 0;
      const prevLayerCount = existingProduct ? Number(existingProduct.layer_count) || 0 : 0;
      const newPalletCount = prevPalletCount - (Number(item.required_pallets) || 0);
      const newLayerCount = prevLayerCount - (Number(item.required_layers) || 0);
      const quantity = newPalletCount * palletUnit + newLayerCount * layerUnit;

      return {
        id: materialId,
        title: (masterInfo && masterInfo.material_name) || (existingProduct && existingProduct.title) || String(materialId),
        category: existingProduct ? existingProduct.category : null,
        quantity,
        price: existingProduct ? existingProduct.price : 0,
        pallet_count: newPalletCount,
        layer_count: newLayerCount,
        production_date: existingProduct ? existingProduct.production_date : null,
        best_before: existingProduct ? existingProduct.best_before : null,
        note: existingProduct ? existingProduct.note : null,
        stock_updated_at: nowStr,
        updated: nowStr
      };
    });

    const { error: prodError } = await sb.from('products').upsert(productPayloads);
    if (prodError) throw prodError;

    productPayloads.forEach(payload => {
      const idx = this.products.findIndex(p => p.id === payload.id);
      if (idx !== -1) {
        this.products[idx] = { ...this.products[idx], ...payload };
      } else {
        this.products.push(payload);
      }
    });

    const runPayload = { status: 'confirmed', confirmed_at: nowStr, updated_at: nowStr };
    const { error: runError } = await sb.from('production_runs').update(runPayload).eq('id', runId);
    if (runError) throw runError;

    Object.assign(run, runPayload);
    return run;
  }
}

const storageInstance = new Storage();
export default storageInstance;
