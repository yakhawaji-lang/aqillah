'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AlertRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await axios.get('/api/admin/rules')
      setRules(response.data.data || [])
    } catch (error) {
      toast.error('فشل تحميل القواعد')
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await axios.patch(`/api/admin/rules/${ruleId}`, { enabled: !enabled })
      toast.success('تم تحديث القاعدة')
      fetchRules()
    } catch (error) {
      toast.error('فشل تحديث القاعدة')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">إدارة قواعد التنبيه</h1>
          <button
            onClick={() => {
              setEditingRule(null)
              setShowForm(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            إضافة قاعدة جديدة
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{rule.name}</h3>
                    {rule.description && (
                      <p className="text-gray-600 mb-4">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">الأولوية:</span>
                      <span className={`px-2 py-1 rounded ${
                        rule.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        rule.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        rule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.priority}
                      </span>
                      <span className="text-gray-500">تم التنشيط:</span>
                      <span className="text-gray-700">{rule.triggerCount} مرة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule.id, rule.enabled)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

